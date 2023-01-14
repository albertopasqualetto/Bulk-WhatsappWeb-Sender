# TODO rename?
# TODO render emoji correctly in labels
# TODO create a package?
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


global BBWWS_NODE_FOLDER
global NUMBERS_FILE
global MESSAGE
global MEDIA_TO_SEND_LIST
global DELAY_VAR


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
        tkmessagebox.showerror("Error", "Bulk WhatsAppWeb Sender is not present!")
        exit()


def init_BBWBS_cli():
    try:
        subprocess.run("node -v", stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, check=True)
    except subprocess.CalledProcessError:
        tkmessagebox.showerror("Error", "Node.js is not installed!\n Trying to install it...")
        out = install_node_js()
        if not out[0]:
            tkmessagebox.showerror("Error", out[1]+"\nPlease install Node.js manually and try again.")
            exit()

    find_BBWBS_cli()

    global BBWWS_NODE_FOLDER
    subprocess.run("npm install --omit=dev", cwd=BBWWS_NODE_FOLDER, shell=True)


# button commands methods
def select_numbers_file():
    filetypes = (
        ('text files', '*.txt'),
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
    DELAY_VAR = int(delay_tk_var.get())

    string_to_run = "npm run start -- --numbers " + NUMBERS_FILE
    string_to_run = "node ./index.js --numbers " + NUMBERS_FILE

    if MESSAGE != "":
        string_to_run += ' --message "' + MESSAGE + '"'
    else:
        string_to_run += " --no-message"

    # TODO maybe fix file paths with spaces
    if MEDIA_TO_SEND_LIST:
        string_to_run += ' --files '
        for media in MEDIA_TO_SEND_LIST:
            string_to_run += '"' + media + '" '
    else:
        string_to_run += " --no-files "

    if DELAY_VAR == -1:
        string_to_run += " --low-delay"
    elif DELAY_VAR == 1:
        string_to_run += " --high-delay"

    subprocess.run(string_to_run, cwd=BBWWS_NODE_FOLDER)


if __name__ == '__main__':
    global NUMBERS_FILE
    NUMBERS_FILE = ''
    global MESSAGE
    MESSAGE = ''
    global MEDIA_TO_SEND_LIST
    MEDIA_TO_SEND_LIST = []
    global DELAY_VAR
    DELAY_VAR = 0

    init_BBWBS_cli()

    root = tk.Tk()
    root.title('BWWBS-GUI')
    # root.geometry('400x400')
    # root.configure(background='white')
    root.columnconfigure(0, weight=1)
    root.columnconfigure(1, weight=2)
    root.columnconfigure(2, weight=1)

    numbers_file_button = ttk.Button(root, text='📞 Select Numbers File', command=select_numbers_file)
    numbers_file_button.grid(row=0, column=0, sticky='W', padx=10, pady=10)
    selected_numbers_file_path_label = ttk.Label(root, text=NUMBERS_FILE)
    selected_numbers_file_path_label.grid(row=0, column=1, columnspan=2, sticky='E', padx=10, pady=10)

    message_label = ttk.Label(root, text='✉️ Message:')
    message_label.grid(row=1, column=0, sticky='W', padx=10, pady=10)
    message_entry = st.ScrolledText(root, width=40, height=5)   # TODO handle emojis properly
    message_entry.grid(row=1, column=1, columnspan=2, sticky='E', padx=10, pady=10)
    # message set in start_BBWBS_cli()

    media_to_send_button = ttk.Button(root, text='📷 Select Media to Send', command=select_media_files)
    media_to_send_button.grid(row=2, column=0, sticky='W', padx=10, pady=10)
    selected_media_to_send_paths_label = ttk.Label(root, text=MEDIA_TO_SEND_LIST)
    selected_media_to_send_paths_label.grid(row=2, column=1, sticky='E', padx=10, pady=10)
    clear_media_to_send_button = ttk.Button(root, text='❌', command=clear_selected_media_files, width=3)
    ToolTip(clear_media_to_send_button, 'Clear all selected media', delay=1.0)
    clear_media_to_send_button.grid(row=2, column=2, sticky='E', padx=10, pady=10)

    delay_label = ttk.Label(root, text='⏱️ Delay:')
    delay_label.grid(row=3, column=0, sticky='W', padx=10, pady=10)
    delay_tk_var = tk.StringVar(None, '0')  # 0 means default delay, -1 means low delay, 1 means high delay
    radio_low = ttk.Radiobutton(root, text='Low Delay', variable=delay_tk_var, value=-1)
    radio_default = ttk.Radiobutton(root, text='Default Delay', variable=delay_tk_var, value=0)
    radio_high = ttk.Radiobutton(root, text='High Delay', variable=delay_tk_var, value=1)
    ToolTip(radio_low, msg="Send messages with a low delay, use this if you are confident that you won't be banned", delay=1.0)
    ToolTip(radio_default, msg="Default delay", delay=1.0)
    ToolTip(radio_high, msg="Send messages with a high delay, use this if you are sending from a new/unused number (high probability of being banned)", delay=1.0)
    radio_low.grid(row=3, column=1, columnspan=2, sticky='W', padx=10, pady=10)
    radio_default.grid(row=3, column=1, columnspan=2, sticky='N', padx=10, pady=10)
    radio_high.grid(row=3, column=1, columnspan=2, sticky='E', padx=10, pady=10)
    # Delay set in start_BBWBS_cli()

    # TODO local-auth and local-chromium ?
    # TODO show qrcode and output in gui

    ttk.Separator(root, orient='horizontal').grid(row=4, column=0, columnspan=3, sticky='EW', padx=10, pady=10)

    send_button = ttk.Button(root, text='🚀 SEND MESSAGES', command=start_BBWBS_cli)
    send_button.grid(row=5, column=0, columnspan=3, sticky='EW', padx=10, pady=5)

    continue_in_terminal_label = ttk.Label(root, text='Then continue in terminal and scan the QR code...')
    continue_in_terminal_label.grid(row=6, column=0, columnspan=3, sticky='N', padx=10, pady=5)

    root.mainloop()
