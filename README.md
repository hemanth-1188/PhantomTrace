# PhantomTrace 📡
**Real-Time Network Intelligence & Threat Visibility Engine**

PhantomTrace is an advanced network observability platform designed to capture, analyze, and visualize live network traffic in real-time.
It provides deep insights into packet flows, topology mapping, and automated threat mitigation.



## 🚀 How to Run PhantomTrace

You do not need to install Python or Node.js to use this tool! Everything is bundled into a single, easy-to-use executable file.

### Step 1: Install the Network Driver (Required)
Because this is a low-level packet sniffer, it requires the Npcap driver to intercept raw network traffic from your Wi-Fi/Ethernet card.
1. Download and install [Npcap](https://npcap.com/).
2. During installation, make sure the box for **"Install Npcap in WinPcap API-compatible Mode"** is checked.

### Step 2: Download and Run
1. Go to the **[Releases](../../releases)** tab on the right side of this GitHub page.
2. Download the latest **`PhantomTrace.exe`** file attached under "Assets".
3. Right-click `PhantomTrace.exe` and select **"Run as Administrator"** (This is strictly required to capture network packets).
4. A terminal window will open showing the server starting.
5. Open your web browser and navigate to: **`http://localhost:8000`**

---

## 🎮 How to Use the Dashboard

Once the platform is running in your browser:

1. **Authorization**: On the landing page, click "Authorize & Enter Console".
2. **Dashboard**: Here you can see an overview of your network health, total packets captured, and recent threats.
3. **Packet Monitor**: Navigate to the Packet Monitor from the sidebar to view a live, real-time scrolling list of all network traffic.
4. **Traffic Map**: Watch as connections are drawn dynamically between your local machine and external servers around the globe.
5. **Threat Center**: Any suspicious activity (like SQL injections, DDoS floods, or Port Scans) will trigger an alert here.
6. **Analytics**: View protocol density charts to see exactly what kind of traffic (HTTP, DNS, TCP) dominates your network.

---

## 📄 License
This project is licensed under the MIT License.
