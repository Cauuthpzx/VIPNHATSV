"""
Simple GUI to view real-time SSH console logs from remote server.
"""
import tkinter as tk
from tkinter import scrolledtext, ttk
import paramiko
import threading
import time

HOST = "160.25.77.94"
PORT = 58687
USER = "root"
PASSWORD = "Nhattruong070219@"


class ServerConsole:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title(f"Server Console - {HOST}:{PORT}")
        self.root.geometry("1000x650")
        self.root.configure(bg="#1e1e1e")

        self.client = None
        self.channel = None
        self.running = False

        self._build_ui()

    def _build_ui(self):
        # Top bar
        top = tk.Frame(self.root, bg="#2d2d2d", pady=5, padx=10)
        top.pack(fill=tk.X)

        tk.Label(top, text=f"SSH: {USER}@{HOST}:{PORT}", fg="#569cd6", bg="#2d2d2d",
                 font=("Consolas", 10)).pack(side=tk.LEFT)

        self.status_label = tk.Label(top, text="Disconnected", fg="#f44747", bg="#2d2d2d",
                                      font=("Consolas", 10, "bold"))
        self.status_label.pack(side=tk.LEFT, padx=20)

        # Buttons
        btn_frame = tk.Frame(top, bg="#2d2d2d")
        btn_frame.pack(side=tk.RIGHT)

        self.connect_btn = tk.Button(btn_frame, text="Connect", command=self.connect,
                                      bg="#0e639c", fg="white", relief=tk.FLAT, padx=10)
        self.connect_btn.pack(side=tk.LEFT, padx=2)

        tk.Button(btn_frame, text="Clear", command=self.clear_log,
                  bg="#3c3c3c", fg="white", relief=tk.FLAT, padx=10).pack(side=tk.LEFT, padx=2)

        # Quick commands
        cmd_frame = tk.Frame(self.root, bg="#252526", pady=3, padx=10)
        cmd_frame.pack(fill=tk.X)

        quick_cmds = [
            ("PM2 Status", "pm2 status"),
            ("PM2 Logs", "pm2 logs --lines 50 --nostream"),
            ("Nginx Status", "systemctl status nginx --no-pager"),
            ("Redis Ping", "redis-cli ping"),
            ("PG Status", "systemctl status postgresql --no-pager | head -10"),
            ("Disk", "df -h /"),
            ("Memory", "free -h"),
            ("Ports", "ss -tlnp | grep -E ':(80|443|3000|5432|6379) '"),
        ]

        for label, cmd in quick_cmds:
            tk.Button(cmd_frame, text=label, command=lambda c=cmd: self.run_command(c),
                      bg="#3c3c3c", fg="#cccccc", relief=tk.FLAT, padx=6, pady=1,
                      font=("Consolas", 8)).pack(side=tk.LEFT, padx=2)

        # Log area
        self.log = scrolledtext.ScrolledText(self.root, bg="#1e1e1e", fg="#d4d4d4",
                                              insertbackground="white",
                                              font=("Consolas", 10),
                                              wrap=tk.WORD, state=tk.DISABLED)
        self.log.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Tag configs
        self.log.tag_configure("cmd", foreground="#569cd6", font=("Consolas", 10, "bold"))
        self.log.tag_configure("error", foreground="#f44747")
        self.log.tag_configure("success", foreground="#6a9955")
        self.log.tag_configure("info", foreground="#d4d4d4")

        # Command input
        bottom = tk.Frame(self.root, bg="#252526", pady=5, padx=10)
        bottom.pack(fill=tk.X)

        tk.Label(bottom, text="$", fg="#569cd6", bg="#252526",
                 font=("Consolas", 12, "bold")).pack(side=tk.LEFT)

        self.cmd_entry = tk.Entry(bottom, bg="#1e1e1e", fg="#d4d4d4",
                                   insertbackground="white",
                                   font=("Consolas", 11), relief=tk.FLAT)
        self.cmd_entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        self.cmd_entry.bind("<Return>", lambda e: self.run_command(self.cmd_entry.get()))

        tk.Button(bottom, text="Run", command=lambda: self.run_command(self.cmd_entry.get()),
                  bg="#0e639c", fg="white", relief=tk.FLAT, padx=15).pack(side=tk.RIGHT)

    def append_log(self, text, tag="info"):
        self.log.configure(state=tk.NORMAL)
        self.log.insert(tk.END, text + "\n", tag)
        self.log.see(tk.END)
        self.log.configure(state=tk.DISABLED)

    def clear_log(self):
        self.log.configure(state=tk.NORMAL)
        self.log.delete(1.0, tk.END)
        self.log.configure(state=tk.DISABLED)

    def connect(self):
        if self.client:
            try:
                self.client.close()
            except:
                pass
        try:
            self.client = paramiko.SSHClient()
            self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            self.client.connect(HOST, port=PORT, username=USER, password=PASSWORD, timeout=10)
            self.status_label.config(text="Connected", fg="#6a9955")
            self.append_log(f"Connected to {HOST}:{PORT}", "success")
        except Exception as e:
            self.status_label.config(text="Error", fg="#f44747")
            self.append_log(f"Connection error: {e}", "error")

    def run_command(self, cmd):
        if not cmd.strip():
            return
        if not self.client:
            self.connect()
            if not self.client:
                return

        self.cmd_entry.delete(0, tk.END)
        self.append_log(f"\n$ {cmd}", "cmd")

        def _exec():
            try:
                stdin, stdout, stderr = self.client.exec_command(cmd, timeout=30)
                out = stdout.read().decode(errors='replace').strip()
                err = stderr.read().decode(errors='replace').strip()
                if out:
                    self.root.after(0, lambda: self.append_log(out, "info"))
                if err:
                    self.root.after(0, lambda: self.append_log(err, "error"))
                if not out and not err:
                    self.root.after(0, lambda: self.append_log("(no output)", "info"))
            except Exception as e:
                self.root.after(0, lambda: self.append_log(f"Error: {e}", "error"))
                self.root.after(0, lambda: self.status_label.config(text="Disconnected", fg="#f44747"))
                self.client = None

        threading.Thread(target=_exec, daemon=True).start()

    def run(self):
        self.root.protocol("WM_DELETE_WINDOW", self.on_close)
        self.root.mainloop()

    def on_close(self):
        if self.client:
            try:
                self.client.close()
            except:
                pass
        self.root.destroy()


if __name__ == "__main__":
    app = ServerConsole()
    app.run()
