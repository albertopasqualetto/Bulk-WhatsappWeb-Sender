# BWWBS-GUI

This is a simple GUI for bulk-whatsappweb-sender.

Just download and run it from the parent folder of the bulk-whatsappweb-sender folder or from a sibling one.

## To build

To build the executable, run:

```
pyinstaller .\main.py --onefile --add-binary "assets/icon.png:assets/" --name BWWBS-GUI --icon assets/icon.png --optimize 2
```
