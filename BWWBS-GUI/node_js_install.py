from sys import platform
import subprocess
from shutil import which


def install_node_js():
    if platform == "linux" or platform == "linux2":
        # linux
        try:
            # different package managers
            if which('apt'):
                subprocess.run("sudo apt install nodejs", shell=True, check=True)
                subprocess.run("sudo apt install npm", shell=True, check=True)
            elif which('pacman'):
                subprocess.run("sudo pacman -S nodejs npm", shell=True, check=True)
            elif which('dnf'):
                subprocess.run("sudo dnf module install nodejs:18/common", shell=True, check=True)
            elif which('yum'):
                subprocess.run("sudo yum install nodejs18", shell=True, check=True)
            elif which('snap'):
                subprocess.run("sudo snap install node --classic --channel=18", shell=True, check=True)
            else:
                return False, "Error while installing Node.js!\nUnsupported package manager."
            return True, ""
        except subprocess.CalledProcessError:
            return False, "Error while installing Node.js!"
    elif platform == "darwin":
        # OS X
        try:
            subprocess.run(["curl", "https://nodejs.org/dist/latest/node-${VERSION:-$(wget -qO- https://nodejs.org/dist/latest/ | sed -nE 's|.*>node-(.*)\.pkg</a>.*|\1|p')}.pkg", ">", '"$HOME/Downloads/node-latest.pkg"', "&&", 'sudo installer -store -pkg "$HOME/Downloads/node-latest.pkg"', '-target "/"'], shell=True, check=True)
            return True, ""
        except subprocess.CalledProcessError:
            return False, "Cannot install Node.js!"
    elif platform == "win32":
        # Windows...
        try:
            subprocess.run("winget install OpenJS.NodeJS.LTS", shell=True, check=True)
            return True, ""
        except subprocess.CalledProcessError:
            return False, "Winget is not installed, cannot install Node.js!"
