import httpProxy from "http-proxy";
import { platform } from "os";
import { exec } from "child_process";
import { createServer as createHttpServer } from "http";
import { getUIPath } from "../../util/pathResolver.js";
import { readFileSync } from "fs";

class ProxyManager {
  private proxyServer!: httpProxy;
  private allowedUrls: Set<string>;
  private isBlocking: boolean;
  private readonly PORT = 3232;

  constructor() {
    this.allowedUrls = new Set();
    this.isBlocking = false;
  }

  private normalizeUrl(url: string): string {
    return url.replace(/^www\./, "").toLowerCase();
  }

  private isUrlAllowed(hostname: string): boolean {
    const normalizedHostname = this.normalizeUrl(hostname);
    return Array.from(this.allowedUrls).some((allowedUrl) => {
      const normalizedAllowedUrl = this.normalizeUrl(allowedUrl);
      return (
        normalizedHostname === normalizedAllowedUrl ||
        normalizedHostname.endsWith("." + normalizedAllowedUrl)
      );
    });
  }

  async setupProxy() {
    const blockPageServer = createHttpServer((req, res) => {
      try {
        const htmlContent = readFileSync(getUIPath(), "utf-8");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(htmlContent);
      } catch (error) {
        res.writeHead(500);
        res.end("Error loading page");
      }
    }).listen(this.PORT + 1);

    const proxy = httpProxy.createProxyServer({});

    const server = createHttpServer((req, res) => {
      try {
        const hostname = new URL(req.url!).hostname;
        console.log("HTTP Request:", req.url);
        if (!this.isBlocking || this.isUrlAllowed(hostname)) {
          proxy.web(req, res, {
            target: req.url,
            secure: false,
            changeOrigin: true,
          });
        } else {
          res.writeHead(302, {
            Location: `http://localhost:${this.PORT + 1}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          });
          res.end();
        }
      } catch (error) {
        res.writeHead(302, {
          Location: `http://localhost:${this.PORT + 1}`,
        });
        res.end();
      }
    });

    server.on("connect", (req, socket, head) => {
      try {
        const hostname = req.url!.split(":")[0];
        if (!this.isBlocking || this.isUrlAllowed(hostname)) {
          proxy.ws(req, socket, head, {
            target: `https://${req.url}`,
            secure: false,
            changeOrigin: true,
          });
        } else {
          socket.write(
            ["HTTP/1.1 403 Forbidden", "Connection: close", "", ""].join("\r\n")
          );
          socket.end();
        }
      } catch (error) {
        socket.end();
      }
    });

    server.listen(this.PORT);
    this.proxyServer = proxy;
  }

  private async setSystemProxy(enabled: boolean) {
    if (platform() === "darwin") {
      const getInterfaces = () =>
        new Promise<string[]>((resolve) => {
          exec("networksetup -listallnetworkservices", (error, stdout) => {
            const interfaces = stdout
              .split("\n")
              .filter((line) => line && !line.includes("*"))
              .map((line) => line.trim());
            resolve(interfaces);
          });
        });

      const interfaces = await getInterfaces();

      for (const iface of interfaces) {
        const commands = enabled
          ? [
              `networksetup -setwebproxy "${iface}" 127.0.0.1 ${this.PORT}`,
              `networksetup -setsecurewebproxy "${iface}" 127.0.0.1 ${this.PORT}`,
              `networksetup -setproxybypassdomains "${iface}" ${Array.from(
                this.allowedUrls
              ).join(" ")}`,
            ]
          : [
              `networksetup -setwebproxystate "${iface}" off`,
              `networksetup -setsecurewebproxystate "${iface}" off`,
            ];

        for (const command of commands) {
          await new Promise((resolve, reject) => {
            exec(command, (error) => {
              if (error) reject(error);
              resolve(true);
            });
          });
        }
      }
    }
  }

  async startBlocking(allowedUrls: string[]) {
    this.allowedUrls = new Set(allowedUrls);
    this.isBlocking = true;
    await this.setSystemProxy(true);
  }

  async stopBlocking() {
    this.isBlocking = false;
    await this.setSystemProxy(false);
  }

  async cleanup() {
    try {
      if (this.proxyServer) {
        this.proxyServer.close();
      }

      await this.stopBlocking();

      if (platform() === "darwin") {
        const getInterfaces = () =>
          new Promise<string[]>((resolve) => {
            exec("networksetup -listallnetworkservices", (error, stdout) => {
              const interfaces = stdout
                .split("\n")
                .filter((line) => line && !line.includes("*"))
                .map((line) => line.trim());
              resolve(interfaces);
            });
          });

        const interfaces = await getInterfaces();

        for (const iface of interfaces) {
          const commands = [
            `networksetup -setwebproxystate "${iface}" off`,
            `networksetup -setsecurewebproxystate "${iface}" off`,
            `networksetup -setautoproxystate "${iface}" off`,
            `networksetup -setproxybypassdomains "${iface}" ""`,
          ];

          for (const command of commands) {
            await new Promise((resolve) => {
              exec(command, () => resolve(true));
            });
          }
        }
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }
}

export default ProxyManager;
