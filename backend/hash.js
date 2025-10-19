import bcrypt from 'bcrypt';
const password = 'password'; // Change if you want a different password

bcrypt.hash(password, 10, function(err, hash) {
  if (err) throw err;
  console.log('Hash for password:', hash);
});