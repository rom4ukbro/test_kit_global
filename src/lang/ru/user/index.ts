export default {
  name: {
    empty: 'Введите имя пользователя',
    exists: 'Имя пользователя уже используется',
  },
  email: {
    empty: 'Введите e-mail',
    type: 'Введите действительный e-mail',
    exists: 'E-mail уже используется',
  },
  password: {
    empty: 'Введите пароль',
  },
  confirmPassword: {
    empty: 'Введите подтверждение пароля',
    notMatch: 'Пароли не совпадают',
  },
  phone: {
    empty: 'Введите номер телефона',
    format: 'Неверный формат номера телефона',
  },
  role: { enum: 'Выберите роль из списка' },
  spec: { enum: 'Выберите специальность из списка' },
  lang: { enum: 'Выберите язык из списка' },
  avatar: { empty: 'Аватар обязателен' },

  notFound: 'Пользователь не найден',
  wrongData: 'Неверный логин или пароль',
  forbidden: 'У вас нет доступа',
  forbiddenParams: 'У вас нет доступа к этому параметру',

  specList: {
    therapist: 'терапевта',
    dentist: 'стоматолога',
  },
};
