# Firebase Storage Access Matrix

**Status:** Approved path/role model supplied for Milestone 0.4. Direct Storage Rules are fail-closed outside the explicitly listed cases. Backend/Admin SDK access bypasses these rules and must authorize each request independently.

## Path Matrix
| Path | Public / unauthenticated | Donor / ordinary user | Assigned Gaushala membership | Direct client writes |
|---|---|---|---|---|
| `public/gaushalas/{gaushalaId}/...` | Read only when trusted object metadata says `moderationStatus == approved` and `publicationStatus == published`. | Same public read. | Same public read. | Always denied. Trusted backend publishes/copies approved media and sets publication metadata. |
| `staging/gaushalas/{gaushalaId}/{uploaderUid}/...` | Denied. | Direct read denied. | Owner/Editor can create a new upload only in their own UID segment and assigned Gaushala. Viewer denied. No direct read/update/delete. | Create-only under matching active membership, MIME/type and size checks. |
| `private/kyc/{gaushalaId}/...` | Denied. | Denied. | Denied through client SDK, including assigned Owner/Editor. | Always denied; authorized backend only. |
| `private/certificates/{userId}/...` | Denied. | The matching donor UID may read. Other users denied. | No extra access. | Always denied; authorized backend only. |
| `private/exports/{userId}/...` | Denied. | The matching donor UID may read. Other users denied. | No extra access. | Always denied; authorized backend only. |
| All other paths | Denied. | Denied. | Denied. | Denied. |

## Storage Rule Conditions
- Staging authorization uses `firestore.get()` for the deterministic `gaushala_admins/{uid}_{gaushalaId}` record and checks matching UID, Gaushala ID, active status, and Owner/Editor role. Storage Rules support Firestore `get`/`exists` cross-service checks; Firebase documentation notes that these reads count toward Firestore usage and require the relevant service permission when deployed. This milestone tests only the local emulator and creates no cloud IAM/resources.
- Staging direct reads are not granted by this matrix; use a backend-authorized preview/download if the product workflow needs one.
- Public approval/publication metadata must be written by trusted backend only. Clients cannot write to the public prefix, so they cannot self-mark media approved/published.
- Storage validates MIME type and size. The approved policy specified validation but no numeric maximum. The initial rule uses a **provisional 10 MiB image cap** for JPEG/PNG/WebP staging uploads; this technical limit requires product-owner confirmation before it becomes a product promise. Video remains outside direct Firebase Storage staging because V2.0 routes gallery video through Cloudflare Stream; confirm final media routing separately.
- KYC, tax certificates, and exports use backend-authorized upload/download operations where needed. Short-lived signed URL/token issuance is not implemented here; it requires an authenticated, authorized backend endpoint and expiry policy.

## V2.1 Alignment and Open Decisions
The policy follows V2.1 least privilege, data minimization, short-lived URL guidance, and separation of object retention from URL lifetime; V2.0's seven-year signed URL example is not used. V2.0 routes gallery video through Cloudflare Stream; this matrix keeps direct staging uploads to images pending final media-flow approval. It does not expose bank/KYC artifacts or claim legal approval for document retention. Confirm allowed image types/size cap, metadata schema, backend preview behavior, and video routing before expanding access.
