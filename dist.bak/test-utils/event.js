"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvent = createEvent;
const common_1 = require("@nostr-relay/common");
function createEvent(params = {}) {
    const tags = params.tags ?? [];
    let nonce = 0;
    if (params.minPowDifficulty) {
        tags.push(params.targetPowDifficulty
            ? [
                common_1.TagName.NONCE,
                nonce.toString(),
                params.targetPowDifficulty.toString(),
            ]
            : [common_1.TagName.NONCE, nonce.toString()]);
    }
    const baseEvent = {
        pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
        kind: params.kind ?? 1,
        created_at: params.created_at ?? (0, common_1.getTimestampInSeconds)(),
        tags,
        content: params.content ?? '',
    };
    let id = getEventHash(baseEvent);
    if (params.minPowDifficulty) {
        while (countPowDifficulty(id) < params.minPowDifficulty) {
            baseEvent.tags.find((tag) => tag[0] === common_1.TagName.NONCE)[1] =
                (++nonce).toString();
            id = getEventHash(baseEvent);
        }
    }
    const sig = signEvent(id, '3689c9acc44041d38a44d0cb777e30f51f295a5e5565b4edb661e8f24eece569');
    return {
        ...baseEvent,
        id,
        sig,
    };
}
function getEventHash(event) {
    return (0, common_1.sha256)([
        0,
        event.pubkey,
        event.created_at,
        event.kind,
        event.tags,
        event.content,
    ]);
}
function signEvent(eventId, key) {
    return (0, common_1.schnorrSign)(eventId, key);
}
function zeroBits(b) {
    let n = 0;
    if (b == 0) {
        return 8;
    }
    while ((b >>= 1)) {
        n++;
    }
    return 7 - n;
}
function countPowDifficulty(hexStr) {
    const buf = Buffer.from(hexStr, 'hex');
    let bits = 0, total = 0;
    for (let i = 0; i < buf.length; i++) {
        bits = zeroBits(buf[i]);
        total += bits;
        if (bits != 8) {
            break;
        }
    }
    return total;
}
//# sourceMappingURL=event.js.map