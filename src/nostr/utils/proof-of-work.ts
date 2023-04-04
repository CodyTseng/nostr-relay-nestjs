function zeroBits(b: number) {
  let n = 0;

  if (b == 0) {
    return 8;
  }

  while ((b >>= 1)) {
    n++;
  }

  return 7 - n;
}

export function countLeadingZeroBits(hexStr: string) {
  const buf = Buffer.from(hexStr, 'hex');
  let bits = 0,
    total = 0;
  for (let i = 0; i < buf.length; i++) {
    bits = zeroBits(buf[i]);
    total += bits;
    if (bits != 8) {
      break;
    }
  }
  return total;
}
