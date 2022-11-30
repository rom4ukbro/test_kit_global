export default {
  name: {
    empty: 'Enter name',
    exists: 'The name is already in use',
  },
  email: {
    empty: 'Enter e-mail',
    type: 'Enter a valid e-mail',
    exists: 'E-mail is already in use',
  },
  password: {
    empty: 'Enter password',
  },
  confirmPassword: {
    empty: 'Enter a confirmation password',
    notMatch: 'Passwords do not match',
  },
  phone: {
    empty: 'Enter a phone number',
    format: 'Incorrect phone number format',
  },
  role: { enum: 'Select a role from the list' },
  spec: { enum: 'Select a specialty from the list' },
  lang: { enum: 'Select a language from the list' },
  avatar: { empty: 'Avatar is required' },

  notFound: 'User not found',
  wrongData: 'Wrong login or password',
  forbidden: 'You do not have access',
  forbiddenParams: 'You do not have access to this parameter',

  specList: {
    therapist: 'therapist',
    dentist: 'dentist',
  },
};
