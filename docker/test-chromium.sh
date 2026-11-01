#!/bin/sh
# Only mounted by compose.verify.yaml; the fixture uses an ephemeral self-signed certificate.
exec /usr/bin/chromium --ignore-certificate-errors "$@"
