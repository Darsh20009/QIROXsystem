#!/usr/bin/env bash
# ============================================================
# QIROX Studio — Android Signing Keystore Generator
# Run this script ONCE and keep the output file secure.
# Upload the keystore to Codemagic → Settings → Android keystores
# ============================================================
set -e

KEYSTORE_FILE="qirox-android.keystore"
KEY_ALIAS="qirox"
STORE_PASS="${ANDROID_STORE_PASS:-QiroxStudio2025!}"
KEY_PASS="${ANDROID_KEY_PASS:-QiroxStudio2025!}"
VALIDITY=10000  # ~27 years

echo ""
echo "═══════════════════════════════════════════════"
echo "  QIROX Studio — Android Keystore Generator"
echo "═══════════════════════════════════════════════"
echo ""

if [ -f "$KEYSTORE_FILE" ]; then
  echo "⚠️  Keystore already exists: $KEYSTORE_FILE"
  echo "   Delete it first if you want to regenerate."
  echo ""
else
  echo "🔑 Generating keystore..."
  keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias    "$KEY_ALIAS" \
    -keyalg   RSA \
    -keysize  2048 \
    -validity $VALIDITY \
    -dname    "CN=QIROX Studio, OU=Engineering, O=QIROX Studio, L=Riyadh, ST=Riyadh, C=SA" \
    -storepass "$STORE_PASS" \
    -keypass   "$KEY_PASS"

  echo ""
  echo "✅ Keystore generated: $KEYSTORE_FILE"
fi

echo ""
echo "📋 SHA-256 Certificate Fingerprint:"
echo "   (Copy this value into the admin panel → Store Publish → Android Fingerprint)"
echo ""
keytool -list -v \
  -keystore "$KEYSTORE_FILE" \
  -alias    "$KEY_ALIAS" \
  -storepass "$STORE_PASS" 2>/dev/null \
| grep -E "SHA256|SHA1|MD5"

echo ""
echo "═══════════════════════════════════════════════"
echo " NEXT STEPS"
echo "═══════════════════════════════════════════════"
echo ""
echo " 1. Upload '$KEYSTORE_FILE' to Codemagic:"
echo "    App Settings → Code signing → Android keystores → Add new"
echo "    Alias:      $KEY_ALIAS"
echo "    Store pass: $STORE_PASS"
echo "    Key pass:   $KEY_PASS"
echo ""
echo " 2. Paste SHA-256 fingerprint into:"
echo "    QIROX Admin Panel → App Publishing → Android Fingerprint"
echo "    (This updates /.well-known/assetlinks.json automatically)"
echo ""
echo " 3. Add Google Play service account JSON to Codemagic:"
echo "    App Settings → Environment variables → GCLOUD_SERVICE_ACCOUNT_CREDENTIALS"
echo ""
echo " 4. Push codemagic.yaml to your repo and start the 'android-twa' workflow."
echo ""
echo "═══════════════════════════════════════════════"
