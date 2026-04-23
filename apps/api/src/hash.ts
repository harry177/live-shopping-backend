import bcrypt from "bcryptjs";

(async () => {
  console.log(await bcrypt.hash("artem23042026", 10));
  console.log(await bcrypt.hash("danil23042026", 10));
})();