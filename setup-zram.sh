#!/usr/bin/env bash
# zram 1GB — compressed swap in RAM. No disk I/O, no SSD wear.
# Run once:  sudo bash setup-zram.sh
set -euo pipefail

echo "==> Loading zram kernel module"
modprobe zram

echo "==> Creating 1G zram device"
echo 1G > /sys/block/zram0/disksize

echo "==> Formatting as swap"
mkswap /dev/zram0

echo "==> Enabling swap (priority 100 — zram preferred over any disk swap)"
swapon -p 100 /dev/zram0

echo "==> Installing boot-time setup script + systemd unit (survives reboot)"
install -m 0755 /dev/stdin /usr/local/sbin/zram-swap-setup.sh <<'SCRIPT'
#!/bin/bash
set -e
modprobe zram
echo 1G > /sys/block/zram0/disksize
mkswap /dev/zram0
swapon -p 100 /dev/zram0
SCRIPT

cat > /etc/systemd/system/zram-swap.service <<'EOF'
[Unit]
Description=zram swap 1G (compressed RAM swap)
After=systemd-modules-load.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/zram-swap-setup.sh
ExecStop=/sbin/swapoff /dev/zram0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable zram-swap.service

echo
echo "==> DONE. Active swap now:"
swapon --show
echo
echo "Verify with:  swapon --show   (should list /dev/zram0, 1G)"
