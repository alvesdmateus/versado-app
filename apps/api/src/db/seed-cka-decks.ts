import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcrypt";
import { eq, and, sql } from "drizzle-orm";
import { users, decks, flashcards } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

const SYSTEM_EMAIL = "system@versado.app";
const SYSTEM_DISPLAY_NAME = "Versado";

interface CKACard {
  front: string;
  back: string;
  tags: string[];
}

const CKA_CARDS: CKACard[] = [
  // ── Cluster Architecture, Installation & Configuration (8 cards, 25% of exam) ──
  {
    front: "What are the main components of a Kubernetes control plane?",
    back: "kube-apiserver (API gateway), etcd (key-value store for cluster state), kube-scheduler (assigns pods to nodes), kube-controller-manager (runs control loops like ReplicaSet, Node, and Endpoint controllers), and cloud-controller-manager (cloud-provider integrations).",
    tags: ["cka", "cluster-architecture"],
  },
  {
    front: "What is etcd and why is it critical in Kubernetes?",
    back: "etcd is a distributed, consistent key-value store that holds all cluster state — every object, config, and secret. If etcd is lost without backup, the entire cluster state is lost. It uses the Raft consensus protocol and listens on port 2379 (client) and 2380 (peer).",
    tags: ["cka", "cluster-architecture"],
  },
  {
    front: "How do you back up and restore etcd?",
    back: "Backup: `ETCDCTL_API=3 etcdctl snapshot save /tmp/snapshot.db --endpoints=https://127.0.0.1:2379 --cacert=... --cert=... --key=...`\nRestore: `etcdctl snapshot restore /tmp/snapshot.db --data-dir=/var/lib/etcd-restored` then update the etcd pod manifest to point to the new data-dir and restart kubelet.",
    tags: ["cka", "cluster-architecture"],
  },
  {
    front: "What is the role of the kubelet?",
    back: "The kubelet is the primary node agent on every worker node. It registers the node with the API server, watches for PodSpecs assigned to its node (via the API server), ensures containers described in those PodSpecs are running and healthy, and reports node/pod status back to the control plane.",
    tags: ["cka", "cluster-architecture"],
  },
  {
    front: "What is the difference between a static pod and a regular pod?",
    back: "Static pods are managed directly by the kubelet on a specific node, not by the API server. Their manifests live in a directory watched by kubelet (default: /etc/kubernetes/manifests). The kubelet creates a mirror pod in the API server for visibility, but the API server cannot control static pods. Control plane components (apiserver, scheduler, etc.) typically run as static pods in kubeadm clusters.",
    tags: ["cka", "cluster-architecture"],
  },
  {
    front: "How do you upgrade a kubeadm cluster?",
    back: "1) Upgrade kubeadm on the control plane node\n2) `kubeadm upgrade plan` then `kubeadm upgrade apply v1.XX.x`\n3) Drain the node: `kubectl drain <node> --ignore-daemonsets`\n4) Upgrade kubelet & kubectl, restart kubelet\n5) Uncordon: `kubectl uncordon <node>`\n6) Repeat drain → upgrade → uncordon for each worker node.\nAlways upgrade one minor version at a time. Never skip minor versions.",
    tags: ["cka", "cluster-architecture"],
  },
  {
    front: "What is kube-proxy and how does it work?",
    back: "kube-proxy runs on every node and maintains network rules that allow communication to pods via Services. It watches the API server for Service/Endpoint changes and updates iptables or IPVS rules accordingly. In iptables mode, it creates DNAT rules; in IPVS mode, it uses kernel-level load balancing for better performance at scale.",
    tags: ["cka", "cluster-architecture"],
  },
  {
    front: "What is a kubeconfig file and what does it contain?",
    back: "A kubeconfig file (default: ~/.kube/config) stores cluster access configuration. It contains three sections: clusters (API server URL + CA cert), users (credentials — client cert, token, or auth plugin), and contexts (a named binding of cluster + user + optional namespace). `kubectl config use-context <name>` switches the active context.",
    tags: ["cka", "cluster-architecture"],
  },

  // ── Workloads & Scheduling (8 cards, 15% of exam) ──
  {
    front: "What is the difference between a Deployment, ReplicaSet, and Pod?",
    back: "Pod: the smallest deployable unit — one or more containers sharing network/storage.\nReplicaSet: ensures a specified number of identical pod replicas are running at all times.\nDeployment: manages ReplicaSets and provides declarative updates, rollback, and scaling. You almost never create ReplicaSets directly — use Deployments.",
    tags: ["cka", "workloads"],
  },
  {
    front: "How do you perform a rolling update and rollback a Deployment?",
    back: "Rolling update: change the container image with `kubectl set image deployment/app container=image:v2` or edit the manifest and apply. Kubernetes creates a new ReplicaSet, scales it up, and scales the old one down.\nRollback: `kubectl rollout undo deployment/app` (to previous) or `kubectl rollout undo deployment/app --to-revision=2` (to a specific revision). Check history with `kubectl rollout history deployment/app`.",
    tags: ["cka", "workloads"],
  },
  {
    front: "What is a DaemonSet and when would you use one?",
    back: "A DaemonSet ensures that one copy of a pod runs on every node (or a subset via nodeSelector/affinity). Use cases: log collectors (fluentd), node monitoring agents (node-exporter), network plugins (calico-node), storage daemons. When a new node joins the cluster, the DaemonSet controller automatically schedules a pod on it.",
    tags: ["cka", "workloads"],
  },
  {
    front: "What are taints and tolerations?",
    back: "Taints are applied to nodes to repel pods: `kubectl taint nodes node1 key=value:NoSchedule`. Tolerations are set on pods to allow scheduling on tainted nodes. Effects: NoSchedule (hard — won't schedule), PreferNoSchedule (soft — avoid if possible), NoExecute (evict existing pods too). Control plane nodes are tainted with `node-role.kubernetes.io/control-plane:NoSchedule` by default.",
    tags: ["cka", "workloads"],
  },
  {
    front: "What is the difference between resource requests and limits?",
    back: "Requests: the guaranteed amount of CPU/memory the container needs — used by the scheduler for placement decisions. Limits: the maximum a container can use — enforced by the kubelet. CPU limits are throttled; memory limits trigger OOMKill. Best practice: always set requests; set limits for memory to prevent OOM, optionally for CPU.",
    tags: ["cka", "workloads"],
  },
  {
    front: "What is a StatefulSet and how does it differ from a Deployment?",
    back: "StatefulSet manages stateful applications with stable, unique identities. Differences from Deployment: 1) Stable network identity — pods are named app-0, app-1, etc. 2) Ordered deployment and scaling. 3) Stable persistent storage — each pod gets its own PVC via volumeClaimTemplates. 4) Ordered, graceful termination (reverse order). Use for databases, Kafka, ZooKeeper.",
    tags: ["cka", "workloads"],
  },
  {
    front: "What is a Job and a CronJob in Kubernetes?",
    back: "Job: runs one or more pods to completion. It retries on failure (configurable backoffLimit) and tracks successful completions. Use for batch processing, migrations, one-off tasks.\nCronJob: creates Jobs on a recurring schedule using cron syntax (e.g., `*/5 * * * *`). Has concurrencyPolicy (Allow/Forbid/Replace) and optional startingDeadlineSeconds.",
    tags: ["cka", "workloads"],
  },
  {
    front: "How do you configure a pod with multiple containers (sidecar pattern)?",
    back: "Define multiple containers in the pod spec's `containers` array. They share the same network namespace (localhost), storage volumes, and lifecycle. Common sidecar patterns: log shippers, service mesh proxies (Envoy/Istio), config reloaders. Init containers (in `initContainers`) run before app containers start — useful for setup tasks, waiting for dependencies.",
    tags: ["cka", "workloads"],
  },

  // ── Services & Networking (10 cards, 20% of exam) ──
  {
    front: "What are the four types of Kubernetes Services?",
    back: "ClusterIP (default): internal-only virtual IP accessible within the cluster.\nNodePort: exposes the service on each node's IP at a static port (30000-32767).\nLoadBalancer: provisions an external load balancer (cloud provider) that routes to NodePort.\nExternalName: maps a service to a DNS CNAME record (no proxying).",
    tags: ["cka", "networking"],
  },
  {
    front: "How does DNS work inside a Kubernetes cluster?",
    back: "CoreDNS runs as a Deployment in kube-system and serves cluster DNS. Services get A records: `<service>.<namespace>.svc.cluster.local`. Pods get records based on their IP. Pods' /etc/resolv.conf points to the CoreDNS ClusterIP. `<service>` works within the same namespace; cross-namespace requires `<service>.<namespace>`.",
    tags: ["cka", "networking"],
  },
  {
    front: "What is an Ingress and how does it differ from a Service?",
    back: "An Ingress is an API object that manages external HTTP/HTTPS access to services. It provides host-based and path-based routing, TLS termination, and name-based virtual hosting — all through a single external IP. A Service is L4 (TCP/UDP) while Ingress is L7 (HTTP). An Ingress Controller (nginx, traefik, etc.) must be installed to fulfill Ingress resources.",
    tags: ["cka", "networking"],
  },
  {
    front: "What is a NetworkPolicy?",
    back: "A NetworkPolicy controls pod-to-pod traffic at the IP/port level. By default, all pods can communicate freely. Once a NetworkPolicy selects a pod, that pod's traffic is restricted to what the policy allows. Rules specify allowed ingress/egress by podSelector, namespaceSelector, or ipBlock. Requires a CNI plugin that supports NetworkPolicy (Calico, Cilium, Weave — not Flannel).",
    tags: ["cka", "networking"],
  },
  {
    front: "What is a CNI plugin and name common ones?",
    back: "CNI (Container Network Interface) is the standard for configuring network interfaces in Linux containers. The CNI plugin handles pod IP allocation and network connectivity. Common plugins: Calico (L3 networking + NetworkPolicy), Flannel (simple overlay, no NetworkPolicy), Cilium (eBPF-based, advanced security), Weave Net (mesh overlay + NetworkPolicy).",
    tags: ["cka", "networking"],
  },
  {
    front: "How do you expose a deployment externally using kubectl?",
    back: "`kubectl expose deployment app --type=NodePort --port=80 --target-port=8080` creates a NodePort service. For cloud environments: `--type=LoadBalancer` provisions an external LB. For testing: `kubectl port-forward svc/app 8080:80` tunnels traffic from localhost to the service. For HTTP routing: create an Ingress resource with an IngressController.",
    tags: ["cka", "networking"],
  },
  {
    front: "What is the pod CIDR and service CIDR in Kubernetes?",
    back: "Pod CIDR: the IP range assigned to pods (e.g., 10.244.0.0/16). Each node gets a subnet from this range. Set via --pod-network-cidr during kubeadm init.\nService CIDR: the virtual IP range for services (e.g., 10.96.0.0/12). Set via --service-cidr. These ranges must not overlap with each other or the node network.",
    tags: ["cka", "networking"],
  },
  {
    front: "What is a headless Service and when do you use it?",
    back: "A headless Service has `clusterIP: None`. Instead of a single virtual IP, DNS returns the individual pod IPs directly. Use with StatefulSets so clients can connect to specific pods (e.g., database-0, database-1). DNS returns A records for each ready pod: `<pod>.<service>.<namespace>.svc.cluster.local`.",
    tags: ["cka", "networking"],
  },
  {
    front: "What are Endpoints and EndpointSlices?",
    back: "Endpoints are automatically created for each Service, listing the IPs and ports of matching pods. EndpointSlices (default since v1.21) split large endpoint lists into smaller chunks for better scalability and performance. Each EndpointSlice holds up to 100 endpoints. kube-proxy watches EndpointSlices to build its forwarding rules.",
    tags: ["cka", "networking"],
  },
  {
    front: "How do you test network connectivity between pods?",
    back: "1) Launch a debug pod: `kubectl run tmp --image=busybox --rm -it -- sh`\n2) Test service DNS: `nslookup <service>.<namespace>`\n3) Test HTTP: `wget -qO- http://<service>:<port>`\n4) Test TCP: `nc -zv <pod-ip> <port>`\n5) Check if NetworkPolicies are blocking: `kubectl get networkpolicy -n <ns>`\n6) Verify CoreDNS is running: `kubectl get pods -n kube-system -l k8s-app=kube-dns`",
    tags: ["cka", "networking"],
  },

  // ── Storage (6 cards, 10% of exam) ──
  {
    front: "What is the difference between a PersistentVolume (PV) and a PersistentVolumeClaim (PVC)?",
    back: "PV: a piece of storage provisioned by an admin or dynamically by a StorageClass — it's the actual storage resource.\nPVC: a request for storage by a user — specifies size, access mode, and optionally a StorageClass. Kubernetes binds a matching PV to the PVC. Pods reference PVCs in their volume mounts.",
    tags: ["cka", "storage"],
  },
  {
    front: "What are the access modes for PersistentVolumes?",
    back: "ReadWriteOnce (RWO): mounted read-write by a single node.\nReadOnlyMany (ROX): mounted read-only by many nodes.\nReadWriteMany (RWX): mounted read-write by many nodes.\nReadWriteOncePod (RWOP): mounted read-write by a single pod (GA in v1.29). Not all storage backends support all modes — cloud block storage typically only supports RWO.",
    tags: ["cka", "storage"],
  },
  {
    front: "What is a StorageClass and what is dynamic provisioning?",
    back: "A StorageClass defines a 'class' of storage (e.g., fast-ssd, standard) with a provisioner, parameters, and reclaim policy. Dynamic provisioning: when a PVC references a StorageClass, Kubernetes automatically creates a PV using the provisioner — no admin intervention needed. Set `storageClassName` on the PVC to use it.",
    tags: ["cka", "storage"],
  },
  {
    front: "What are the PersistentVolume reclaim policies?",
    back: "Retain: PV is kept after PVC deletion — data preserved, PV must be manually cleaned and made available again.\nDelete: PV and underlying storage are deleted when PVC is removed (default for dynamic provisioning).\nRecycle (deprecated): basic scrub (`rm -rf /the/volume/*`) then made available again. Use Retain for production data safety.",
    tags: ["cka", "storage"],
  },
  {
    front: "How do you mount a ConfigMap or Secret as a volume?",
    back: "In the pod spec, add a volume referencing the ConfigMap/Secret, then mount it in the container:\n```yaml\nvolumes:\n- name: config\n  configMap:\n    name: app-config\ncontainers:\n- volumeMounts:\n  - name: config\n    mountPath: /etc/config\n```\nEach key becomes a file in the mount directory. Updates to the ConfigMap propagate to the mounted files (with a delay).",
    tags: ["cka", "storage"],
  },
  {
    front: "What are volumeClaimTemplates in a StatefulSet?",
    back: "volumeClaimTemplates define PVC templates in a StatefulSet spec. For each pod replica, Kubernetes creates a unique PVC (e.g., data-mysql-0, data-mysql-1). These PVCs persist across pod restarts and rescheduling, ensuring each replica has stable, dedicated storage. On StatefulSet deletion, PVCs are NOT automatically deleted — they must be cleaned up manually.",
    tags: ["cka", "storage"],
  },

  // ── Security (6 cards, tested within Cluster Architecture domain) ──
  {
    front: "What is RBAC in Kubernetes?",
    back: "Role-Based Access Control (RBAC) restricts cluster access based on roles. Key objects:\n- Role/ClusterRole: defines permissions (verbs on resources, e.g., get, list, create pods)\n- RoleBinding/ClusterRoleBinding: assigns a role to a user, group, or ServiceAccount\nRole + RoleBinding are namespaced. ClusterRole + ClusterRoleBinding are cluster-wide.",
    tags: ["cka", "security"],
  },
  {
    front: "What is a ServiceAccount and how is it used?",
    back: "A ServiceAccount provides an identity for pods to authenticate with the API server. Each namespace has a 'default' ServiceAccount. Pods automatically mount the SA token. Best practice: create dedicated ServiceAccounts with minimal RBAC permissions per workload. Set `automountServiceAccountToken: false` on pods that don't need API access.",
    tags: ["cka", "security"],
  },
  {
    front: "How do you create a Secret and use it in a pod?",
    back: "Create: `kubectl create secret generic db-creds --from-literal=user=admin --from-literal=pass=s3cret`\nUse as env vars:\n```yaml\nenv:\n- name: DB_USER\n  valueFrom:\n    secretKeyRef:\n      name: db-creds\n      key: user\n```\nOr mount as a volume. Secrets are base64-encoded (not encrypted) by default. Enable encryption at rest via EncryptionConfiguration for production.",
    tags: ["cka", "security"],
  },
  {
    front: "What is a SecurityContext in Kubernetes?",
    back: "SecurityContext defines privilege and access control settings at the pod or container level. Key fields: `runAsUser` / `runAsGroup` (UID/GID), `runAsNonRoot: true` (reject root), `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, `capabilities` (drop ALL, add only needed). Pod-level securityContext applies to all containers unless overridden.",
    tags: ["cka", "security"],
  },
  {
    front: "How do TLS certificates work in a Kubernetes cluster?",
    back: "Kubernetes uses PKI for secure component communication. The cluster CA signs certificates for: apiserver (serving), kubelet (client+server), etcd (peer+client), scheduler, controller-manager. kubeadm generates these in /etc/kubernetes/pki/. Certificates have expiry (1 year by default). Renew with `kubeadm certs renew all`. Inspect with `openssl x509 -in <cert> -text -noout`.",
    tags: ["cka", "security"],
  },
  {
    front: "What is the difference between a ConfigMap and a Secret?",
    back: "ConfigMap: stores non-sensitive configuration data as key-value pairs or files. Stored in plaintext in etcd.\nSecret: stores sensitive data (passwords, tokens, keys). Base64-encoded (not encrypted by default), but can be encrypted at rest via EncryptionConfiguration. Both can be consumed as environment variables or mounted as volumes.",
    tags: ["cka", "security"],
  },

  // ── Troubleshooting (12 cards, 30% of exam — the most heavily weighted domain) ──
  {
    front: "A pod is in CrashLoopBackOff — how do you diagnose it?",
    back: "1) `kubectl describe pod <name>` — check Events for error messages, OOMKilled, image pull errors\n2) `kubectl logs <pod>` — see application logs from the current crash\n3) `kubectl logs <pod> --previous` — see logs from the last crashed container\n4) Check resource limits — OOMKilled means the container exceeded its memory limit\n5) Check liveness probe — a failing probe causes restarts\n6) Verify the container command/entrypoint is correct",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "A pod is stuck in Pending state — what are the common causes?",
    back: "1) Insufficient resources — no node has enough CPU/memory to satisfy requests (`kubectl describe pod` shows FailedScheduling)\n2) No matching node — nodeSelector, affinity, or taints prevent scheduling\n3) PVC not bound — the required PersistentVolumeClaim can't find a matching PV\n4) ResourceQuota exceeded — namespace quota is full\n5) Too many pods — node has hit its pod limit\nCheck: `kubectl describe pod` → Events section for the specific reason.",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "How do you debug a node that shows NotReady?",
    back: "1) `kubectl describe node <name>` — check Conditions (MemoryPressure, DiskPressure, PIDPressure, Ready)\n2) SSH to the node and check kubelet: `systemctl status kubelet`, `journalctl -u kubelet -f`\n3) Check container runtime: `systemctl status containerd`\n4) Check disk space: `df -h`\n5) Check certificates haven't expired: `openssl x509 -in /var/lib/kubelet/pki/kubelet-client-current.pem -text -noout`\n6) Check connectivity to the API server",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "A pod shows ImagePullBackOff — what are the causes and fixes?",
    back: "Causes: 1) Image name/tag is wrong — verify with `kubectl describe pod` → Events\n2) Image doesn't exist in the registry\n3) Private registry requires auth — create a docker-registry Secret and set `imagePullSecrets` on the pod spec\n4) Network connectivity to the registry is blocked\nFix: correct the image name, create/fix imagePullSecrets, or check node network egress rules.",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "How do readiness and liveness probes work, and what happens when they fail?",
    back: "Liveness probe: checks if the container is alive. Failure → kubelet kills and restarts the container. Use for detecting deadlocks.\nReadiness probe: checks if the container can accept traffic. Failure → pod is removed from Service endpoints (no traffic routed to it), but NOT restarted. Use for slow-starting apps.\nStartup probe: disables liveness/readiness until it succeeds. Use for apps with long initialization.\nProbe types: httpGet, tcpSocket, exec.",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "How do you use kubectl logs effectively for troubleshooting?",
    back: "`kubectl logs <pod>` — current container logs\n`kubectl logs <pod> --previous` — logs from the last terminated container\n`kubectl logs <pod> -c <container>` — specific container in a multi-container pod\n`kubectl logs <pod> --since=1h` — logs from the last hour\n`kubectl logs <pod> -f` — follow/stream logs in real time\n`kubectl logs -l app=myapp` — logs from all pods matching a label selector",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "How do you troubleshoot a service that isn't routing traffic?",
    back: "1) Check the service exists and has the correct selector: `kubectl describe svc <name>`\n2) Verify endpoints exist: `kubectl get endpoints <name>` — if empty, the selector doesn't match any running pods\n3) Check pod labels match: `kubectl get pods --show-labels`\n4) Verify pods are Running and Ready\n5) Test from within the cluster: `kubectl run tmp --image=busybox --rm -it -- wget -qO- <service>:<port>`\n6) Check NetworkPolicies blocking traffic",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "How do you use kubectl to execute commands inside a running container?",
    back: "`kubectl exec -it <pod> -- /bin/sh` — interactive shell in single-container pod\n`kubectl exec -it <pod> -c <container> -- /bin/sh` — specific container in multi-container pod\n`kubectl exec <pod> -- cat /etc/config/app.conf` — run a single command\nFor debugging pods without a shell: `kubectl debug <pod> -it --image=busybox --target=<container>` creates an ephemeral debug container sharing the pod's namespaces.",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "How do you use jsonpath and custom-columns to extract specific data from kubectl output?",
    back: "jsonpath: `kubectl get pods -o jsonpath='{.items[*].metadata.name}'`\nGet specific field: `kubectl get node node1 -o jsonpath='{.status.addresses[?(@.type==\"InternalIP\")].address}'`\ncustom-columns: `kubectl get pods -o custom-columns='NAME:.metadata.name,STATUS:.status.phase'`\nThese are essential for CKA — many tasks require extracting specific values and saving to files.",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "What are ResourceQuota and LimitRange, and how do you troubleshoot quota issues?",
    back: "ResourceQuota: limits total resource consumption per namespace (CPU, memory, object counts). Pods exceeding quota are rejected at creation.\nLimitRange: sets default requests/limits and min/max constraints per container in a namespace.\nTroubleshoot: `kubectl describe resourcequota -n <ns>` shows used vs. hard limits. `kubectl describe limitrange -n <ns>` shows defaults. A pod stuck in 'cannot be created' often means the namespace quota is exhausted.",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "How do you drain and cordon a node for maintenance?",
    back: "`kubectl cordon <node>` — marks the node as unschedulable (no new pods), but existing pods keep running.\n`kubectl drain <node> --ignore-daemonsets --delete-emptydir-data` — evicts all pods (except DaemonSets) and cordons the node. Pods managed by controllers are recreated on other nodes.\n`kubectl uncordon <node>` — marks the node schedulable again.\nAlways drain before maintenance (OS updates, kubelet upgrades).",
    tags: ["cka", "troubleshooting"],
  },
  {
    front: "A kubelet fails to start after a cluster upgrade — how do you fix it?",
    back: "1) Check kubelet status: `systemctl status kubelet` and `journalctl -u kubelet --no-pager -l`\n2) Common causes: version mismatch (kubelet must be within one minor version of apiserver), expired certificates, misconfigured kubelet config at /var/lib/kubelet/config.yaml, or container runtime not running\n3) Check cert expiry: `kubeadm certs check-expiration`\n4) Ensure containerd is running: `systemctl status containerd`\n5) Restart: `systemctl daemon-reload && systemctl restart kubelet`",
    tags: ["cka", "troubleshooting"],
  },
];

async function seedCKADecks() {
  console.log("Seeding CKA decks...\n");

  // Ensure system user exists
  const passwordHash = await bcrypt.hash("SystemUser!2024#Versado", 4);

  await db
    .insert(users)
    .values({
      email: SYSTEM_EMAIL,
      passwordHash,
      displayName: SYSTEM_DISPLAY_NAME,
      emailVerified: true,
      tier: "fluent",
      preferences: {
        darkMode: false,
        themeColor: "sky",
        dailyGoal: 0,
        reminderTimes: [],
        cardSortingLogic: "due_first",
        pushAlerts: false,
        favoriteDeckIds: [],
      },
    })
    .onConflictDoNothing({ target: users.email });

  const [systemUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SYSTEM_EMAIL))
    .limit(1);

  if (!systemUser) {
    console.error("Failed to create or find system user");
    process.exit(1);
  }

  console.log(`System user: ${SYSTEM_EMAIL} (${systemUser.id})`);

  // Check if CKA deck already exists
  const [existing] = await db
    .select({ id: decks.id })
    .from(decks)
    .where(
      and(
        eq(decks.ownerId, systemUser.id),
        sql`${decks.tags} @> '["cka"]'::jsonb`,
        eq(decks.tombstone, false),
      ),
    )
    .limit(1);

  if (existing) {
    console.log("  CKA deck already exists — skipping");
    return;
  }

  // Create deck
  const [deck] = await db
    .insert(decks)
    .values({
      ownerId: systemUser.id,
      name: "CKA Exam Prep",
      description:
        "50 high-quality flashcards covering all CKA exam domains: Cluster Architecture, Workloads & Scheduling, Services & Networking, Storage, Security, and Troubleshooting.",
      tags: ["cka"],
      visibility: "marketplace",
      marketplace: {
        listed: true,
        price: 0,
        purchaseCount: 0,
        rating: 0,
        reviewCount: 0,
      },
      stats: {
        totalCards: CKA_CARDS.length,
        newCards: CKA_CARDS.length,
        learningCards: 0,
        reviewCards: 0,
        masteredCards: 0,
      },
    })
    .returning();

  // Create flashcards
  await db.insert(flashcards).values(
    CKA_CARDS.map((c) => ({
      deckId: deck!.id,
      front: c.front,
      back: c.back,
      tags: c.tags,
      source: { type: "manual" as const },
    })),
  );

  console.log(`  CKA Exam Prep — ${CKA_CARDS.length} cards created`);
  console.log(`\n========================================`);
  console.log(`  CKA deck seeded!`);
  console.log(`  Domain breakdown (weighted to match CKA exam):`);
  console.log(`    Cluster Architecture: 8 cards (25%)`);
  console.log(`    Workloads & Scheduling: 8 cards (15%)`);
  console.log(`    Services & Networking: 10 cards (20%)`);
  console.log(`    Storage: 6 cards (10%)`);
  console.log(`    Security: 6 cards`);
  console.log(`    Troubleshooting: 12 cards (30%)`);
  console.log(`========================================\n`);
}

async function main() {
  await seedCKADecks();
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
