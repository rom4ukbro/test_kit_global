export default {
  oneDay:
    '{current_date} | Привіт {user.name}! Нагадуємо що ви записані до $t(user.specList.{doctor.spec}) завтра о {date}!',
  twoHours:
    '{current_date} | Привіт {user.name}! Вам через 2 години до $t(user.specList.{doctor.spec}) о {date}!',
};
