# 🛡️ Hybrid Cloud Crypto Vault & Intrusion Detection System

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)](#)
[![GCP](https://img.shields.io/badge/Google_Cloud-App_Engine_%7C_KMS-4285F4?logo=google-cloud&logoColor=white)](#)
[![AWS](https://img.shields.io/badge/AWS-S3_%7C_CloudFront-FF9900?logo=amazonaws&logoColor=white)](#)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?logo=firebase&logoColor=white)](#)
[![Security](https://img.shields.io/badge/Crypto-AES--256--GCM-success)](#)

**Author:** Shaurya Singh  
**Architecture:** Decoupled Serverless Microservices (AWS + GCP + Firebase)  
**Encryption Standard:** AES-256-GCM with Hardware-Backed Envelope Encryption  

## 📖 Project Overview

This project is an enterprise-grade, serverless cryptographic vault designed to demonstrate advanced cloud security protocols, digital forensics, and secure real-time communication. 

Moving beyond standard application-level encryption, this vault implements **Envelope Encryption** utilizing Google Cloud's Key Management Service (KMS) Hardware Security Modules (HSMs) to protect Data Encryption Keys (DEKs). The architecture strictly isolates the static frontend, the cryptographic backend, and the real-time transport layer across three separate cloud providers to eliminate single points of failure.

## 🏗️ Architecture & Tech Stack

* **Frontend (Delivery):** HTML5, CSS3, Vanilla JS, GSAP (Hosted on AWS S3 & CloudFront).
* **Backend (Cryptography & Forensics):** Python 3.12, Flask, Gunicorn (Hosted on GCP App Engine Standard).
* **Real-Time Transport (Chat Pub/Sub):** Firebase Realtime Database (Serverless).
* **Cryptographic Engine:** Python `cryptography` library (AES-256-GCM / PBKDF2).
* **Key Management:** Google Cloud KMS (REST API).
* **Database / Auditing:** SQLite (Ephemeral `/tmp` storage for forensic tracking).

## ✨ Core Security Features

### 1. Hardware-Backed Envelope Encryption
Files and text are never encrypted directly with a user password. Instead:
* A random 32-byte Data Encryption Key (DEK) is generated per transaction.
* The DEK is encrypted by a physical Master Key held in Google Cloud KMS.
* The payload is encrypted locally using the plaintext DEK via AES-256-GCM.
* The encrypted DEK, Initialization Vector (IV), Auth Tag, and Ciphertext are bundled. Data remains mathematically unreadable without both the user's password and strict GCP IAM authorization.

### 2. Real-Time End-to-End Encrypted Chat
A secure communication room utilizing Firebase as a serverless signaling server. 
* All messages are encrypted client-side using AES-256-GCM before leaving the browser.
* Firebase only routes the ciphertext, ensuring the transport layer acts as a Zero-Knowledge provider.

### 3. Forensic Audit Logging & Threat Map
Designed with digital forensics in mind, the system logs every cryptographic operation to identify potential intrusions.
* Captures exact timestamps, IP Addresses, Geo-location mapping, and Device/User-Agent classification.
* Tracks success/failure events (e.g., failed decryption attempts triggering intrusion alerts).
* Features a live, interactive 3D Threat Intelligence Map and instant PDF export for incident reporting.

### 4. Duress / Panic Wipe Mechanism
In the event of physical device compromise, the UI features a "Panic Wipe" webhook. This instantly purges all ephemeral forensic logs from the server and resets the UI state, leaving zero traces of prior cryptographic operations.

### 5. Active Threat Simulation
Includes a real-time password entropy analyzer and a visual PBKDF2 Brute Force Matrix simulator to demonstrate the mathematical impracticality of cracking standard AES keys against hardware throttling.

## 🚀 Setup & Deployment

### 1. Frontend (AWS)
* Upload `dashboard.html`, `vault.css`, and `vault.js` to a public AWS S3 bucket.
* Configure for static website hosting and attach an Amazon CloudFront distribution. Ensure caching is invalidated after updates.

### 2. Transport Layer (Firebase)
* Create a Firebase project and instantiate a Realtime Database.
* Inject the `firebaseConfig` object into the frontend to handle serverless P2P communication.

### 3. Backend & KMS (Google Cloud)
* Authenticate with GCP CLI: `gcloud auth login`
* Set project: `gcloud config set project [YOUR_PROJECT_ID]`
* Create a KeyRing and CryptoKey in GCP KMS.
* Grant the App Engine Default Service Account the `CryptoKey Encrypter/Decrypter` IAM role.
* Deploy the serverless backend: `gcloud app deploy`

---
*Disclaimer: This is an academic project built for the advanced study of cyber security, digital forensics, and hybrid-cloud architecture.*