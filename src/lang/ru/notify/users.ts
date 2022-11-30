export default {
  oneDay:
    '{current_date} | Привет {user.name}! Напоминаем что вы записаны к $t(user.specList.{doctor.spec}) завтра в {date}!',
  twoHours:
    '{current_date} | Привет {user.name}! Вам через 2 часа к $t(user.specList.{doctor.spec}) в {date}!',
};
