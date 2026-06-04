const bcrypt = require('bcrypt');

async function test() {
  const password = 'test123';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('Hash:', hash);
  const match = await bcrypt.compare(password, hash);
  console.log('Match:', match);
  const wrongMatch = await bcrypt.compare('wrong', hash);
  console.log('Wrong match:', wrongMatch);
}

test().catch(console.error);