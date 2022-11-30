export default {
  oneDay:
    '{current_date} | Hi {user.name}! We remind you that you have an appointment for $t(user.specList.{doctor.spec}) tomorrow at {date}!',
  twoHours:
    '{current_date} | Hi {user.name}! You have 2 hours to go to $t(user.specList.{doctor.spec}) on {date}!',
};
