export default function createRandomOTP(length: number) {
  let otp = "";
  let j = 0;
  for (let i = 0; i < length; i++) {
    if (i === 0) {
      while (j === 0) j = Math.floor(Math.random() * 10);
      otp += j;
      continue;
    }
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
}
