import subprocess
import socket
import ipaddress
from concurrent.futures import ThreadPoolExecutor

# Configure your subnet
SUBNET = "192.168.1.0/24"
COMMON_PORTS = [22, 80, 443]  # optional

import platform

def ping_host(ip):
    param = "-n" if platform.system().lower() == "windows" else "-c"
    timeout = "-w" if platform.system().lower() == "windows" else "-W"
    cmd = ["ping", param, "1", timeout, "1000", str(ip)]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL)
    return res.returncode == 0


def resolve_hostname(ip):
    try:
        return socket.gethostbyaddr(str(ip))[0]
    except:
        return str(ip)

def scan_ports(ip, ports=COMMON_PORTS):
    active_ports = []
    for port in ports:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            if sock.connect_ex((str(ip), port)) == 0:
                active_ports.append(port)
            sock.close()
        except:
            continue
    return active_ports

def scan_ip(ip):
    up = ping_host(ip)
    hostname = resolve_hostname(ip) if up else None
    ports = scan_ports(ip) if up else []
    return {"ip": str(ip), "hostname": hostname, "up": up, "active_ports": ports}

def scan_network(subnet):
    results = []
    with ThreadPoolExecutor(max_workers=50) as executor:
        for result in executor.map(scan_ip, ipaddress.IPv4Network(subnet)):
            results.append(result)
    return results

if __name__ == "__main__":
    devices = scan_network(SUBNET)
    for d in devices:
        print(d)
