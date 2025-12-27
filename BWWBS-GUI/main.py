# to build: pyinstaller .\main.py -F
# TODO rename?
# TODO render emoji correctly in labels
# TODO create a package?
# TODO icon
import tkinter as tk
from tkinter import ttk
from tkinter import messagebox as tkmessagebox
from tkinter import scrolledtext as st
from tkinter import filedialog as fd
from tktooltip import ToolTip
from node_js_install import install_node_js

import sys
import os
import subprocess
import threading

import requests
import webbrowser


global BBWWS_NODE_FOLDER
global VERSION
global NUMBERS_FILE
global MESSAGE
global MEDIA_TO_SEND_LIST
global DELAY_VAR
global ROOT
global STATUS_VAR
global PROGRESS_BAR
global IS_BUSY

ROOT = None
STATUS_VAR = None
PROGRESS_BAR = None
IS_BUSY = False


# init methods
def find_BBWBS_cli():
    global BBWWS_NODE_FOLDER
    bwwbs_node_path_not_compiled = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "bulk-whatsappweb-sender"))
    if getattr(sys, 'frozen', False):   # if compiled
        BBWWS_NODE_FOLDER = os.path.abspath(os.path.join(os.path.dirname(sys.executable), "bulk-whatsappweb-sender"))
    elif os.path.exists(bwwbs_node_path_not_compiled):
        BBWWS_NODE_FOLDER = bwwbs_node_path_not_compiled
        return
    else:
        raise FileNotFoundError("Bulk WhatsAppWeb Sender is not present!")


def init_BBWBS_cli():
    try:
        cmd = ["node", "-v"] if os.name == 'nt' else "node -v"
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, check=True, shell=True)
    except (FileNotFoundError, subprocess.CalledProcessError):
        out = install_node_js()
        if not out[0]:
            raise RuntimeError(out[1] + "\nPlease install Node.js manually and try again.")

    find_BBWBS_cli()

    global BBWWS_NODE_FOLDER
    cmd = ["npm", "install", "--omit=dev"] if os.name == 'nt' else "npm install --omit=dev"
    subprocess.run(cmd, cwd=BBWWS_NODE_FOLDER, check=True, shell=True)


def get_BWWBS_cli_version():
    global BBWWS_NODE_FOLDER
    global VERSION
    cmd = ["npm", "view", ".", "version"] if os.name == 'nt' else "npm view . version"
    out = subprocess.run(cmd, cwd=BBWWS_NODE_FOLDER, capture_output=True, text=True, shell=True)
    VERSION = (out.stdout or "").strip()
    return VERSION


def set_busy(is_busy: bool, message: str = ""):
    global IS_BUSY
    IS_BUSY = is_busy

    if STATUS_VAR is not None:
        STATUS_VAR.set(message if is_busy else "")

    if PROGRESS_BAR is not None:
        if is_busy:
            # If it was previously hidden with grid_remove(), show it again.
            try:
                PROGRESS_BAR.grid()
            except tk.TclError:
                pass
            try:
                PROGRESS_BAR.configure(value=0)
            except tk.TclError:
                pass
            PROGRESS_BAR.start(10)
        else:
            PROGRESS_BAR.stop()

            # Keep the progress bar visible briefly after stopping,
            # then hide it (unless a new job started in the meantime).
            if ROOT is not None:
                def hide_if_still_idle():
                    if not IS_BUSY and PROGRESS_BAR is not None:
                        try:
                            PROGRESS_BAR.grid_remove()
                        except tk.TclError:
                            pass

                ROOT.after(3000, hide_if_still_idle)

    if ROOT is None:
        return

    # Block the whole UI while a background job runs.
    try:
        ROOT.attributes("-disabled", is_busy)
        return
    except tk.TclError:
        # Fallback for platforms/window managers that don't support "-disabled".
        pass

    def set_children_state(widget, state):
        for child in widget.winfo_children():
            try:
                child.configure(state=state)
            except tk.TclError:
                pass
            set_children_state(child, state)

    set_children_state(ROOT, tk.DISABLED if is_busy else tk.NORMAL)


def run_background(job, busy_message: str, on_done=None):
    if ROOT is None:
        return

    def runner():
        err = None
        res = None
        try:
            res = job()
        except Exception as e:
            err = e

        def finish():
            set_busy(False)
            if err is not None:
                tkmessagebox.showerror("Error", str(err))
            if on_done is not None:
                on_done(res, err)

        ROOT.after(0, finish)

    set_busy(True, busy_message)
    threading.Thread(target=runner, daemon=True).start()


def check_for_updates(tk_root):
    def worker():
        try:
            from packaging.version import Version

            global VERSION
            get_BWWBS_cli_version()

            response = requests.get(
                'https://api.github.com/repos/albertopasqualetto/Bulk-WhatsappWeb-Sender/releases/latest',
                headers={"User-Agent": "BWWBS-GUI"},
                timeout=5,
            )
            if response.status_code != 200:
                return

            remote_version = response.json().get('tag_name', '').strip().lstrip('v')
            if not remote_version or not VERSION:
                return

            if Version(remote_version) > Version(VERSION):
                tk_root.after(0, lambda: popup_update(tk_root))
        except requests.RequestException:
            # Offline / slow network / GitHub blocked: don't block or crash the GUI.
            return
        except Exception:
            # Any parsing/version errors shouldn't impact startup.
            return

    threading.Thread(target=worker, daemon=True).start()


def popup_update(tk_root):  # TODO window does not appear on top
    pop = tk.Toplevel(tk_root)
    pop.wm_title("Update available")
    pop.transient(tk_root)
    pop.grab_set()
    pop.lift()
    pop.protocol("WM_DELETE_WINDOW", pop.destroy)

    label_pop = ttk.Label(pop, text="A new version of Bulk-WhatsAppWeb-Sender is available!")
    label_pop.grid(row=0, column=0, columnspan=2, padx=10, pady=10)

    label2_pop = ttk.Label(pop, text="Please download it from:")
    label2_pop.grid(row=1, column=0, padx=2)

    link = ttk.Label(pop, text="https://github.com/albertopasqualetto/Bulk-WhatsappWeb-Sender/releases/latest", foreground="blue", cursor="hand2")
    link.grid(row=1, column=1, padx=1)
    link.bind("<Button-1>", lambda e: webbrowser.open_new("https://github.com/albertopasqualetto/Bulk-WhatsappWeb-Sender/releases/latest"))

    ok_pop = ttk.Button(pop, text="OK", command=pop.destroy)
    ok_pop.grid(row=2, column=0, columnspan=2, padx=10, pady=10)

    pop.focus_force()
    tk_root.wait_window(pop)


# button commands methods
def select_numbers_file():
    filetypes = (
        ('CSV/Text/VCF files', '*.csv *.txt *.vcf'),
        ('All files', '*.*')
    )

    filename = fd.askopenfilename(
        title='Open a file',
        initialdir='./',
        filetypes=filetypes)

    global NUMBERS_FILE
    NUMBERS_FILE = filename

    selected_numbers_file_path_label.config(text=filename, foreground="black")


def select_media_files():
    filenames = fd.askopenfilenames(
        title='Open files',
        initialdir='./')

    global MEDIA_TO_SEND_LIST
    MEDIA_TO_SEND_LIST += filenames

    filenames_string = ""
    for filename in MEDIA_TO_SEND_LIST:
        filenames_string += filename + "\n"
    selected_media_to_send_paths_label.config(text=filenames_string)


def clear_selected_media_files():
    global MEDIA_TO_SEND_LIST
    MEDIA_TO_SEND_LIST = []
    selected_media_to_send_paths_label.config(text="")


def start_BBWBS_cli():
    global BBWWS_NODE_FOLDER
    global NUMBERS_FILE
    global MESSAGE
    global MEDIA_TO_SEND_LIST
    global DELAY_VAR

    if NUMBERS_FILE == "":
        selected_numbers_file_path_label.config(text="Please select a file!", foreground="red")
        return

    MESSAGE = message_entry.get("1.0", "end-1c")
    try:
        DELAY_VAR = int(delay_tk_var.get())
    except ValueError:
        DELAY_VAR = 0

    args = ["npm", "run", "start", "--", "--numbers", NUMBERS_FILE]

    if MESSAGE:
        args += ["--message", MESSAGE]
    else:
        args += ["--no-message"]

    if MEDIA_TO_SEND_LIST:
        args += ["--files", *MEDIA_TO_SEND_LIST]
    else:
        args += ["--no-files"]

    if DELAY_VAR == -1:
        args += ["--low-delay"]
    elif DELAY_VAR == 1:
        args += ["--high-delay"]

    def job():
        if not BBWWS_NODE_FOLDER or not os.path.exists(BBWWS_NODE_FOLDER):
            raise FileNotFoundError("Bulk WhatsAppWeb Sender folder not found.")
        try:
            cmd = args if os.name == 'nt' else " ".join(shlex.quote(str(a)) for a in args)
            return subprocess.run(cmd, cwd=BBWWS_NODE_FOLDER, shell=True).returncode
        except FileNotFoundError:
            raise RuntimeError(
                "Failed to start the sender. Ensure Node.js is installed and available in PATH (the `node` command must work)."
            )

    def done(res, err):
        if err is None and isinstance(res, int) and res != 0:
            tkmessagebox.showerror("Error", f"Sender exited with code {res}.")

    run_background(job, "Running sender…", on_done=done)


def export_contacts():
    global BBWWS_NODE_FOLDER
    global ROOT
    if not BBWWS_NODE_FOLDER or not os.path.exists(BBWWS_NODE_FOLDER):
        tkmessagebox.showerror("Error", "Bulk WhatsAppWeb Sender folder not found.")
        return

    def job():
        # Runs in terminal; QR is printed there.
        cmd = ["npm", "run", "exportcontacts"] if os.name == 'nt' else "npm run exportcontacts"
        proc = subprocess.run(cmd, cwd=BBWWS_NODE_FOLDER, shell=True)
        return proc.returncode

    def done(res, err):
        out_file = os.path.join(BBWWS_NODE_FOLDER, "contacts.vcf")
        if err is None and res == 0:
            tkmessagebox.showinfo("Done", f"Contacts exported to:\n{out_file}")
        elif err is None:
            tkmessagebox.showerror("Error", "Export contacts failed. Check the terminal output.")

    run_background(job, "Exporting contacts…", on_done=done)


if __name__ == '__main__':
    NUMBERS_FILE = ''
    MESSAGE = ''
    MEDIA_TO_SEND_LIST = []
    DELAY_VAR = 0

    root = tk.Tk()
    ROOT = root
    root.title('BWWBS-GUI')
    # root.geometry('400x400')
    # root.configure(background='white')
    root.columnconfigure(0, weight=1)
    root.columnconfigure(1, weight=2)
    root.columnconfigure(2, weight=1)


    export_contacts_button = ttk.Button(root, text='📥 EXPORT CONTACTS', command=export_contacts)
    export_contacts_button.grid(row=0, column=0, columnspan=3, sticky='EW', padx=10, pady=(10, 5))

    ttk.Separator(root, orient='horizontal').grid(row=1, column=0, columnspan=3, sticky='EW', padx=10, pady=10)

    numbers_file_button = ttk.Button(root, text='📞 Select Numbers File', command=select_numbers_file)
    numbers_file_button.grid(row=2, column=0, sticky='W', padx=10, pady=10)
    selected_numbers_file_path_label = ttk.Label(root, text=NUMBERS_FILE)
    selected_numbers_file_path_label.grid(row=2, column=1, columnspan=2, sticky='E', padx=10, pady=10)

    message_label = ttk.Label(root, text='✉️ Message:')
    message_label.grid(row=3, column=0, sticky='W', padx=10, pady=10)
    message_entry = st.ScrolledText(root, width=40, height=5)   # TODO handle emojis properly
    message_entry.grid(row=3, column=1, columnspan=2, sticky='E', padx=10, pady=10)
    # message set in start_BBWBS_cli()

    media_to_send_button = ttk.Button(root, text='📷 Select Media to Send', command=select_media_files)
    media_to_send_button.grid(row=4, column=0, sticky='W', padx=10, pady=10)
    selected_media_to_send_paths_label = ttk.Label(root, text=MEDIA_TO_SEND_LIST)
    selected_media_to_send_paths_label.grid(row=4, column=1, sticky='E', padx=10, pady=10)
    clear_media_to_send_button = ttk.Button(root, text='❌', command=clear_selected_media_files, width=3)
    ToolTip(clear_media_to_send_button, 'Clear all selected media', delay=1.0)
    clear_media_to_send_button.grid(row=4, column=2, sticky='E', padx=10, pady=10)

    delay_label = ttk.Label(root, text='⏱️ Delay:')
    delay_label.grid(row=5, column=0, sticky='W', padx=10, pady=10)
    delay_tk_var = tk.StringVar(None, '0')  # 0 means default delay, -1 means low delay, 1 means high delay
    radio_low = ttk.Radiobutton(root, text='Low Delay', variable=delay_tk_var, value=-1)
    radio_default = ttk.Radiobutton(root, text='Default Delay', variable=delay_tk_var, value=0)
    radio_high = ttk.Radiobutton(root, text='High Delay', variable=delay_tk_var, value=1)
    ToolTip(radio_low, msg="Send messages with a low delay, use this if you are confident that you won't be banned", delay=1.0)
    ToolTip(radio_default, msg="Default delay", delay=1.0)
    ToolTip(radio_high, msg="Send messages with a high delay, use this if you are sending from a new/unused number (high probability of being banned)", delay=1.0)
    radio_low.grid(row=5, column=1, columnspan=2, sticky='W', padx=10, pady=10)
    radio_default.grid(row=5, column=1, columnspan=2, sticky='N', padx=10, pady=10)
    radio_high.grid(row=5, column=1, columnspan=2, sticky='E', padx=10, pady=10)
    # Delay set in start_BBWBS_cli()

    # TODO local-auth and local-chromium ?
    # TODO show qrcode and output in gui

    ttk.Separator(root, orient='horizontal').grid(row=6, column=0, columnspan=3, sticky='EW', padx=10, pady=10)

    send_button = ttk.Button(root, text='🚀 SEND MESSAGES', command=start_BBWBS_cli)
    send_button.grid(row=7, column=0, columnspan=3, sticky='EW', padx=10, pady=5)

    continue_in_terminal_label = ttk.Label(root, text='Then continue in terminal and scan the QR code...')
    continue_in_terminal_label.grid(row=8, column=0, columnspan=3, sticky='N', padx=10, pady=5)

    STATUS_VAR = tk.StringVar(value="")
    status_label = ttk.Label(root, textvariable=STATUS_VAR)
    status_label.grid(row=9, column=0, columnspan=2, sticky='W', padx=10, pady=(0, 10))
    PROGRESS_BAR = ttk.Progressbar(root, mode='indeterminate')
    PROGRESS_BAR.grid(row=9, column=2, sticky='E', padx=10, pady=(0, 10))

    def init_done(res, err):
        if err is None:
            check_for_updates(root)

    def init_job():
        try:
            init_BBWBS_cli()
        except Exception as e:
            raise e

    run_background(init_job, "Setting up… (installing dependencies)", on_done=init_done)

    root.mainloop()
