const getData = require('./server/data')
const generateCalendarData = require('./server/calendar')

const memoryCache = require('memory-cache')

const CACHE_DISABLED = false
const CACHE_TIME = 30


const cache = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = memoryCache.get(key)
    if (cachedBody) {
      res.send(cachedBody)
      return
    }
    
    
    res.sendResponse = res.send
    res.send = (body) => {
      memoryCache.put(key, body, duration * 1000);
      res.sendResponse(body)
    }
    next()
  }
}

const express = require('express')
const app = express()
const mustacheExpress = require('mustache-express')

app.engine('mustache', mustacheExpress())

app.set('view engine', 'mustache')
app.set('views', __dirname + '/views')

app.use(express.static('public'))

app.get('/', cache(CACHE_DISABLED ? 1 : CACHE_TIME), (request, response) => { 
  const TAGLINE = 'Join us this month for codebar Monthlies!'
  const URL = 'https://monthlies.glitch.me'
  
  getData().then(events => {
    const event = events.find(event => {
      if (!event.state || typeof event.state !== 'string') {
        return false
      }
      return event.state.toLowerCase() === 'current' || event.state.toLowerCase() === 'cancelled'
    })
    const pastEvents = events.filter(event => {
      if (!event.state || typeof event.state !== 'string') {
        return false
      }
      return event.state.toLowerCase() === 'past'
    })
        
    if (!event) {
      return response.render('home', { 
        hashtag: 'codebarMonthly',
        event: null,
        pastEvents: pastEvents || [],
        calendarData: {},
        directionLinks: {},
        tagline: TAGLINE
      })
    }
    
    const calendarData = generateCalendarData({
      title: `codebar Monthlies ${event.name} ${event.emoji}`,
      start: new Date(`${event.date} 18:30`),
      end: new Date(`${event.date} 20:30`),     
      address: `${event.venue.name}, ${event.venue.address.join(', ')}`,
      url: URL,
      description: `${TAGLINE} - ${URL}`
    })    

    const directionLinks = {
      google: [
        `https://www.google.com/maps/dir/`,
        `?api=1&destination=${encodeURIComponent(event.venue.address.join(', '))}`
      ].join(''),
      citymapper: [
        `https://citymapper.com/directions`,
        `?endcoord=${encodeURIComponent(event.venue.coords)}`,
        `&endname=${encodeURIComponent(event.venue.name)}`,
        `&endaddress=${encodeURIComponent(event.venue.address.join(', '))}`
      ].join('')
    }
    
    response.render('home', {
      hashtag: 'codebarMonthlies',
      event,
      pastEvents: pastEvents || [],
      calendarData,
      directionLinks,
      tagline: TAGLINE
    })
  })
  
  .catch(err => {
    console.error(err)
    response.render('home', {
      hashtag: 'codebarMonthlies',
      event: null,
      pastEvents: [],
      calendarData: false,
      directionLinks: {},
      tagline: TAGLINE
    })
  })
})

const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
