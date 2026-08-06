# Ignition Environment Reference (Sanofi IIoT Platform)

Source: two gateway backups (`.gwbk`) supplied 2026-08-06 —
- **Edge**: `Ignition-ignition-edge-primary-5b86dcffc8-sqc5j` (edition `edge`)
- **Platform**: `Ignition-ignition-7548d65f64-mpjpt` (full/standard edition)

Both are **Ignition 8.3.6.2026042713**, running as Kubernetes pods in namespace
`iiotplatform-scale-26187450-non-prod`. All facts below came from the file-based
`config/resources/**` resource store (Ignition 8.3's config format) — the legacy
`db_backup_sqlite.idb` in both backups is empty/default and was not a useful source.

No passwords, private keys, certificate PEM bodies, or secret ciphertexts are
recorded here — only which credentials/certs *exist* and what they're used for.

---

## 1. Topology (as configured)

```
[Device layer]
   4x OPC-UA "ProgrammableSimulatorDevice" on Edge   (NO real PLC/Modbus/AB/Siemens driver present)
   Edge OPC-UA client → "IP21 CORE Dev" (AspenTech InfoPlus.21 OPC UA @ xsnw12x016p.pharma.aventis.com:63500) — DISABLED

        │  Ignition OPC UA Server (Edge, loopback)
        ▼
[Edge gateway - "ignition-edge-primary"]
   Tag provider "edge" (STANDARD) ── Edge Historian (store & forward, scanRate 100ms / forwardRate 1000ms)
   MQTT Transmission → transmitter "Edge Transmitter"
        Sparkplug B: groupId=SANOFI, edgeNodeId=EDGE_DEV_NODE_01, deviceId=EDGE_DEV_DEVICE_01, tagPath=UNS
        └─ server "Ignition Data Platform": ssl://ignition-platform-primary.<namespace>.svc.cluster.local:8883
                                              user Distributor_Admin, CA=Sanofi_Root_CA, client cert CN=ignition-edge-primary
        └─ server "Chariot SCADA": tcp://localhost:1883 (local/test broker, user admin)
   Gateway Network OUTGOING → host "ignition-platform-primary" : 8060 (SSL)   [Edge initiates]
   Gateway Network INCOMING ← Edge's own backup/standby pod                   [PendingApproval]

        │  MQTT over TLS (Sparkplug B)              │  Gateway Network (GAN)
        ▼                                            ▼
[Platform gateway - "ignition-platform-primary"]
   MQTT Distributor (broker) — port 1883 / TLS 8883, users: admin, Distributor_Admin
   MQTT Engine ← subscribes to its own Distributor via the same external hostname
        default namespace "Sparkplug B": spBv1.0/#, unsFolderPrefix=UNS, unsTagsEnabled=true
        default namespace "Elecsys":     tags/#,RBE/#,JPG/#,sys/#,cmd/# (non-Sparkplug devices)
   Tag provider "edge" (REMOTE, historyMode=GatewayNetwork) → browses Edge's tags directly over GAN
   Tag provider "MQTT Engine" (MANAGED) → UNS tree populated from Sparkplug ingestion
   Historian (SqlHistorian) "Sanofi_LocalDataStorage_Dev" → Postgres DB "ignition-DB-AWS" (AWS RDS, eu-west-1)
   MQTT Transmission (module enableTransmission = FALSE) → UNS transmitter "Solace SBX Transmitter"
        tagProvider=MQTT Engine, tagPath=UNS → server "Solace SBX": ssl://solace-sbx-aws-amer-rosa.sanofi.com:8883 (mTLS)
   Gateway Network INCOMING ← Edge (live) + Edge backup + Platform's own backup   [ALL PendingApproval]
   Project scripts: PullEdgeUNS / CleanEdgeUNSFolder / CopyRsyncEdgeUNS / Adjust_UNS_Transmitter

        ▼
[Cloud / downstream]
   Solace PubSub+ broker (Sanofi AMER, AWS) — external UNS relay target
   AWS RDS Postgres (ignition-DB-AWS primary + ignition-DB-AWS-02 secondary, eu-west-1) — historian storage
```

**Two parallel dataflow mechanisms exist between Edge and Platform:**
1. **MQTT / Sparkplug B** — Edge Transmitter → Platform's own Distributor broker → Platform's Engine (UNS tag tree). This is the primary "modern" path.
2. **Gateway Network (GAN) remote tag provider** — Platform's `edge` REMOTE tag provider browses Edge's tags directly, used by `PullEdgeUNS`/`CopyRsyncEdgeUNS` scripts. **This path is currently non-functional** — see Finding #1 below.

---

## 2. Known issues / things to validate next

These were found directly in the backup configuration, not inferred:

1. **Gateway Network link is not approved.** Every GAN incoming connection on both gateways shows `securityStatus: PendingApproval` — including the live Edge→Platform connection itself, not just the backup-node ones. Until approved on both sides (Config → Networking → Gateway Network → Incoming Connections), the `edge` REMOTE tag provider on Platform and the `PullEdgeUNS`/`CopyRsyncEdgeUNS` scripts cannot be working.
2. **No real field devices.** All 4 OPC-UA devices on Edge are `ProgrammableSimulatorDevice` — there is no Modbus/Allen-Bradley/Siemens/DNP3 driver configured anywhere. Any "device data" currently flowing is simulated. The one real external OPC-UA source (`IP21 CORE Dev`, AspenTech InfoPlus.21) is present but **disabled**.
3. **Edge alarm notification profiles are shells.** `EdgeEmailNotification` (emailProfile/roster both null) and `EdgeRemoteNotification` (serverName/targetProfile both null) are both `enabled: false` and have no target configured even if re-enabled.
4. **Dangling audit profile reference on Edge.** MQTT Transmission general settings reference `auditProfile: EdgeAuditProfile`, but no such audit-profile resource exists on Edge.
5. **Platform's MQTT Transmission module is disabled at the top level** (`enableTransmission: false`), even though the individual "Solace SBX Transmitter" (enabled) and cert/server records look fully configured. The Solace relay will not actually run until the module-level switch is turned on.
6. **EAM is not installed on either gateway** (`installMode: "NotInstalled"` on both) despite resource folders existing. No centralized agent/controller relationship is active.
7. **Historian retention looks misconfigured.** `Sanofi_LocalDataStorage_Dev`'s description says "180 days" but `pruning.age` is set to `30 SEC` — data would be pruned almost immediately, contradicting the stated retention window. Worth confirming in the Platform gateway UI.
8. **No active redundancy.** Both gateways report `redundancy.noderole: Independent` — despite backup/standby pods attempting to register over the Gateway Network (all pending), neither gateway is currently part of an active redundant pair.
9. **Platform's "Pre-Prod" and "Sandbox" config modes are empty.** Both exist (inherit from `core`) but contain no overriding resources yet — currently no-ops if the intent was environment-specific config layering.
10. Identity providers `PHARMA` / `temp` are `type: internal` (DB-backed with LDAP-style claim mapping), not a true external OIDC/SAML federation, despite attribute-mapper fields (`sub`, `preferred_username`, `given_name`) resembling OIDC claims — confirm this is intentional.

---

## 3. Edge gateway — configuration inventory

| Item | Value |
|---|---|
| System name | `Ignition-ignition-edge-primary-5b86dcffc8-sqc5j` |
| Edition | Edge |
| Ports | HTTP 8088, HTTPS 8043, Gateway Network 8060 |
| Project | `Edge` (Perspective + Vision) |
| Tag provider | `edge` (STANDARD, DB persistence) |
| Historian | "Edge Historian", store-and-forward, scanRate 100ms, forwardRate 1000ms |

**Modules**: MQTT Transmission, Alarm Notification, EAM, OPC UA, Perspective, Vision.
No MQTT Engine/Distributor, no SQL Historian module, no SFC.

**OPC-UA devices** (all simulators, all enabled):
| Device | Driver | Rate |
|---|---|---|
| SLCSimulator | ProgrammableSimulatorDevice | 1000ms |
| Simulator Device | ProgrammableSimulatorDevice | 1000ms |
| Stress-Test Increase Rate | ProgrammableSimulatorDevice | 100ms |
| test | ProgrammableSimulatorDevice | 1000ms |

**OPC-UA client connections**: default loopback `Ignition OPC UA Server`; `IP21 CORE Dev` (AspenTech InfoPlus.21, `xsnw12x016p.pharma.aventis.com:63500`, user `PHARMA\PU198692`) — **disabled**.

**MQTT Transmission**: transmission enabled; transmitter "Edge Transmitter" (Sparkplug B, group `SANOFI`, node `EDGE_DEV_NODE_01`, device `EDGE_DEV_DEVICE_01`, tag path `UNS`); servers "Ignition Data Platform" (→ Platform's Distributor, TLS 8883) and "Chariot SCADA" (local test broker, `tcp://localhost:1883`).

**Gateway Network**: outgoing to `ignition-platform-primary:8060` (SSL); incoming from Edge's own backup pod (pending approval).

**EAM**: present, not installed as agent or controller.

**Alarms**: journal `EdgeJournal` (local); notification profiles `EdgeEmailNotification` / `EdgeRemoteNotification` (both disabled, unconfigured).

**Identity/auth**: identity providers `PHARMA` (LDAP-backed, `vds21-eu.sanofi.com:636`) and `temp` (fallback); security zone `PlatformGateway` scopes what the Platform gateway is allowed to do when connecting in (ReadWriteEdit on tag providers, QueryOnly on alarm/audit/history, Deny on secrets).

**Secrets**: `PI.Secrets` provider holds PI Web API URL/user/password for `PI_Dev` and `Toronto` PI historians (values redacted).

**Scripting** (project `Edge`): PI historian integration scripts (`PI_Core_Dev_Connection_Ignition`, `PI_Engine`, `PI2`, `Device_UDT_Import`), a `SendUNS` message handler, timers simulating/updating values.

---

## 4. Platform gateway — configuration inventory

| Item | Value |
|---|---|
| System name | `Ignition-ignition-7548d65f64-mpjpt` |
| Edition | Standard/full |
| Ports | HTTP 8088, HTTPS 8043, Gateway Network 8060 |
| Project | `Data_Platform_Cloud_Dev` (Perspective + Vision + Eventstream, empty) |
| Tag providers | `MQTT Distributor`, `MQTT Engine`, `MQTT Transmission` (all MANAGED); `edge` (REMOTE, via GAN); `platform` (STANDARD, DB persistence) |

**Modules**: MQTT Distributor, MQTT Engine, MQTT Transmission, EAM, Historian (SqlHistorian), OPC UA, Perspective, SFC. No Alarm Notification module at all on Platform.

**OPC-UA**: no devices configured — Platform does not poll any field device directly; only the default loopback OPC UA server connection exists.

**MQTT Distributor** (broker running on Platform): TCP 1883 + TLS 8883 enabled, WebSocket disabled, anonymous connections disallowed. Users: `admin`, `Distributor_Admin`.

**MQTT Engine**: enabled; blocks remote device/node commands; alarm event publishing enabled; servers "Ignition Data Platform" (→ its own Distributor via external hostname, enabled) and a disabled localhost test entry. Default namespaces: `Sparkplug B` (`spBv1.0/#`, UNS-enabled) and `Elecsys` (`tags/#,RBE/#,JPG/#,sys/#,cmd/#`, UNS disabled).

**MQTT Transmission**: module-level transmission **disabled**. Configured but not (currently) running: "Solace SBX Transmitter" (UNS → external Solace broker `solace-sbx-aws-amer-rosa.sanofi.com:8883`, mTLS) and an unused sample "Example Transmitter". "Chariot SCADA" server present but disabled.

**Gateway Network**: no outgoing connections (Platform is the passive/receiving side); three incoming connections, all pending approval — the live Edge gateway, Edge's backup pod, and Platform's own backup pod.

**EAM**: present, not installed as agent or controller (same as Edge).

**Alarms**: no alarm-notification module, no journals, no security zones.

**Identity/auth**: same `PHARMA` / `temp` identity providers as Edge; additional LDAP user source `PHARMA-VDS` (staging LDAP, `vds20-eu-stg.sanofi.com:636`).

**Historian**: `Sanofi_LocalDataStorage_Dev` (SqlHistorian) → Postgres `ignition-DB-AWS`. Store-and-forward engines: `ignition-DB-AWS`, `ignition-DB-AWS-02`, `ignition-dev-primary` (third-party).

**Databases**: `ignition-DB-AWS` (primary, `dev-ignition-infrastructure-db-postgres-primary...eu-west-1.rds.amazonaws.com`, user `AdminUserPrimary`) and `ignition-DB-AWS-02` (secondary, `...-secondary...`, user `AdminUserSecondary`) — AWS RDS Postgres primary/secondary pair.

**Audit**: `Sanofi_AuditProfile` (database, table `audit_events`, 90-day retention).

**Secrets**: `Config_Secrets` and `PI.Secrets` providers (PI Web API credential keys, values redacted).

**API tokens**: `Key_http_read`, `key_https_read`, `testing`, `tim` (all enabled).

**Scripting** (project `Data_Platform_Cloud_Dev`): `PullEdgeUNS`, `CleanEdgeUNSFolder`, `CopyRsyncEdgeUNS` (message handlers/scheduled script pulling & syncing Edge's UNS tags), `Adjust_UNS_Transmitter`, `Adjust_UNS_Historystore`.

---

## 5. Certificate trust relationships

Both gateways trust the same **Sanofi Root CA** (`CN=Sanofi Root CA, O=Sanofi, C=FR`). Mutual-TLS client certs for the Edge↔Platform MQTT link:
- Edge: `CN=ignition-edge-primary, OU=PREPROD, O=Sanofi, C=FR`
- Platform: `CN=ignition-platform-primary, OU=PREPROD, O=Sanofi, C=FR`

Platform additionally holds separate cert material for the external Solace SBX connection (`Ignition_SBX_Toronto-Client-Certificate/-Key`, `Sanofi Root 2`) and what looks like AWS IoT / SiteWise integration certs (`AmazonRootCA1.pem`, `Sitewise_Data_Dev-client-cert/-key`) — not currently wired to an active, enabled transmitter besides Solace SBX.

---

*Compiled 2026-08-06 from gateway backups `Ignitionignitionedgeprimary...Ignitionbackupedge202608060648.gwbk` and `Ignitionignition...Ignitionbackup202608060648.gwbk`. No credential values, keys, or certificate bodies are recorded in this document.*
