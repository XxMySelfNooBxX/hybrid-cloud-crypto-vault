# 🛡️ Hybrid Cloud Crypto Vault & Intrusion Detection System

**Author:** Shaurya Singh  
**Architecture:** Serverless Hybrid Cloud (AWS + GCP)  
**Encryption Standard:** AES-256-GCM with Envelope Encryption (Google Cloud KMS)

---

## 📖 Project Overview
This project is an enterprise-grade, serverless cryptographic vault designed to demonstrate advanced cloud security concepts. It utilizes a hybrid-cloud architecture, hosting a static frontend on **AWS S3** that securely communicates with a Python backend deployed on **Google Cloud App Engine**. 

Rather than relying on standard application-level encryption, this vault implements **Envelope Encryption** utilizing Google Cloud's Key Management Service (KMS) hardware security modules (HSMs) to protect the Data Encryption Keys (DEKs).

## 🏗️ Architecture & Tech Stack
* **Frontend:** HTML5, CSS3, Vanilla JS (Hosted on AWS S3)
* **Backend:** Python 3, Flask, Gunicorn (Hosted on Google App Engine)
* **Cryptographic Engine:** `cryptography` (AES-256-GCM)
* **Key Management:** Google Cloud KMS (REST API)
* **Database / Logging:** SQLite (Ephemeral `/tmp` storage for forensic tracking)

## ✨ Core Security Features

### 1. Hardware-Backed Envelope Encryption
Files and text are never encrypted directly with a user password. Instead:
* A random 32-byte Data Encryption Key (DEK) is generated per transaction.
* The DEK is encrypted by a physical Master Key held in Google Cloud KMS.
* The payload is encrypted locally using the plaintext DEK via AES-256-GCM.
* The encrypted DEK, Initialization Vector (IV), Auth Tag, and Ciphertext are bundled together, ensuring data is mathematically unreadable without both the user's password and GCP IAM authorization.

### 2. Forensic Audit Logging
Designed with digital forensics in mind, the system logs every cryptographic operation. It captures:
* Timestamps & IP Addresses
* Geo-location mapping
* Device/User-Agent classification
* Success/Failure events (e.g., failed decryption attempts)
* *Note: Logs can be exported instantly to PDF for incident reporting.*

### 3. Duress / Panic Wipe Mechanism
In the event of physical device compromise, the UI features a "Panic Wipe" webhook that instantly purges all ephemeral forensic logs from the server and resets the UI state, leaving zero traces of prior cryptographic operations.

### 4. Active Threat Simulation
The frontend includes a real-time password entropy analyzer and a visual Brute Force simulation to demonstrate the mathematical impracticality of cracking standard AES keys.

## 🚀 Setup & Deployment
1. **Frontend:** Upload the `dashboard.html` file to a public AWS S3 bucket configured for static website hosting.
2. **Backend:** * Authenticate with GCP CLI: `gcloud auth login`
   * Set project: `gcloud config set project [YOUR_PROJECT_ID]`
   * Deploy server: `gcloud app deploy`
3. **KMS:** Create a KeyRing and CryptoKey in GCP KMS and grant the App Engine Default Service Account the `CryptoKey Encrypter/Decrypter` role.

---
*Disclaimer: This is an academic project built for studying cyber security, digital forensics, and cloud architecture.*