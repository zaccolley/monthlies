const MS_IN_MINUTES = 60 * 1000

function formatTime (date) {
  return date.toISOString().replace(/-|:|\.\d+/g, '')
}

const calendarGenerators = {
  google: (event, startTime, endTime) => {
    const href = encodeURI([
      'https://www.google.com/calendar/render',
      '?action=TEMPLATE',
      '&text=' + (event.title || ''),
      '&dates=' + (startTime || ''),
      '/' + (endTime || ''),
      '&details=' + (event.description || ''),
      '&location=' + (event.address || ''),
      '&sprop=&sprop=name:'
    ].join(''))

    return href
  },

  ical: (event, startTime, endTime) => {
    const href = encodeURI(
      'data:text/calendar;charset=utf8,' + [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'URL:' + (event.url || ''),
        'DTSTART:' + (startTime || ''),
        'DTEND:' + (endTime || ''),
        'SUMMARY:' + (event.title || ''),
        'DESCRIPTION:' + (event.description || ''),
        'LOCATION:' + (event.address || ''),
        'END:VEVENT',
        'END:VCALENDAR'].join('\n'));

    return href
  }
};

function generateCalendarData (event) {
  const startTime = formatTime(event.start)
  const endTime = formatTime(event.end)

  return {
    google: calendarGenerators.google(event, startTime, endTime),
    ical: calendarGenerators.ical(event, startTime, endTime)
  }
}

module.exports = generateCalendarData