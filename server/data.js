const Airtable = require('airtable')
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_API_KEY
})
const base = Airtable.base('appBeHYaJEULDepLC')
const moment = require('moment')

const getTableData = (table, functionToApplyToRecord) => new Promise((resolve, reject) => {
  const data = []
  
  return base(table)
    .select({ view: 'Grid view' })
    .eachPage((records, fetchNextPage) => {
      records.forEach(record => {        
        data.push(record)
      })

      fetchNextPage()
    }, err => {
      if (err) {
        return reject(err)
      }

      return resolve(data)
    })
})

const getPeople = () => {
  return getTableData('People').then(records => records.map((record) => {
    return {
      id: record.id,
      name: record.get('Name'),
      pronouns: record.get('Pronouns'),
      link: record.get('Twitter') || record.get('Link') 
    }
  }))
}

const getVenues = () => {
  return getTableData('Venues').then(records => records.map((record) => {
    return {
      id: record.id,
      name: record.get('Name'),
      address: record.get('Address').split(',') || [],
      coords: record.get('Co-ordinates')
    }
  }))
}

const getTalks = () => {
  return getTableData('Talks').then(records => records.map((record) => {
    return {
      id: record.id,
      peopleIds: record.get('People'),
      talk: {
        name: record.get('Name'),
        summary: record.get('Summary').split('\n') || [],
        length: record.get('Length')
      }
    }
  }))
}

const getPanels = () => {
  return getTableData('Panels').then(records => records.map((record) => {
    return {
      id: record.id,
      name: record.get('Name'),
      summary: record.get('Summary').split('\n') || [],
      hostIds: record.get('Hosts') || [],
      memberIds: record.get('Members') || []
    }
  }))
}

const getEvents = () => {
  return getTableData('Events').then(records => records.map((record) => {
    const dateTicketsAvailableData = record.get('Date tickets available') || null
    
    let dateTicketsAvailable = null
    const dateTicketsAvailablePassed = moment(dateTicketsAvailableData) <= moment()
    if (!dateTicketsAvailablePassed && dateTicketsAvailableData) { 
      dateTicketsAvailable = moment(dateTicketsAvailableData).format('LLL')
    }
    
    return {
      id: record.id,
      name: record.get('Date: Name'),
      date: record.get('Date: DD/MM/YYYY'),
      link: record.get('codebar Link'),
      emoji: record.get('Emoji'),
      state: record.get('State') || false,
      panelIds: record.get('Panels') || [],
      talkIds: record.get('Talks') || [],
      venueIds: record.get('Venue') || null,
      cancelled: record.get('Cancelled') || false,
      dateTicketsAvailable
    }
  }))
}

const combineData = (events, talks, venues, people, panels) => {
  return events.map(event => {
    if (event.talkIds) {
      event.talks = event.talkIds.map(talkId => {
        const talk = talks.find(talk => talk.id === talkId)
        
        if (talk.peopleIds) {
          talk.people = talk.peopleIds.map(personId => {
            return people.find(person => person.id === personId)
          })
        }
        
        return talk
      })
    }

    if (event.venueIds) {
      event.venue = venues.find(venue => venue.id === event.venueIds[0])
    }
        
    if (event.panelIds) {
      event.panel = panels.find(panel => panel.id === event.panelIds[0])
      
      if (event.panel) {
        if (event.panel.hostIds) {
          event.panel.hosts = event.panel.hostIds.map(personId => {
            return people.find(person => person.id === personId)
          })
        }

        if (event.panel.memberIds) {
          event.panel.members = event.panel.memberIds.map(personId => {
            return people.find(person => person.id === personId)
          })
        }
      }
    }

    return event
  })
}

const getData = () => new Promise((resolve, reject) => {
  const dataPromises = [
    getEvents(), getTalks(), getVenues(), getPeople(), getPanels()
  ]

  return Promise.all(dataPromises).then(values => {
    const [ events, talks, venues, people, panels ] = values

    const combinedData = combineData(events, talks, venues, people, panels)
    
    return resolve(combinedData)
  }).catch(reason => { 
    return reject(reason)
  })
})

module.exports = getData