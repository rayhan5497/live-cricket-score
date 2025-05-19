// const upcomingUrl = 'http://localhost:5000/api/upcoming';
const upcomingUrl = 'https://live-cricket-score-f9hg.onrender.com/api/upcoming';
const upcomingOptions = {
  method: 'GET',
};

let lastUpdated = 0;
let cachedResponse = null;

async function fetchUpcomingMatch() {
  const currentTime = Date.now();
  const cached = localStorage.getItem('upcomingCache');
  const cachedTime = parseInt(localStorage.getItem('lastUpdated'), 10);

  if (cached && cachedTime && currentTime - cachedTime < 3 * 60 * 60 * 1000) {
    console.log('using cached data (client side)');
    console.log(JSON.parse(cached));
    cachedResponse = JSON.parse(cached);
    lastUpdated = cachedTime;
    updateUI(cachedResponse);
    return;
  }

  try {
    const response = await fetch(upcomingUrl, upcomingOptions);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    const data = await response.json();
    cachedResponse = data;
    lastUpdated = currentTime;

    // Cache in localStorage for offline or later use
    localStorage.setItem('upcomingCache', JSON.stringify(data));
    localStorage.setItem('lastUpdated', currentTime.toString());

    console.log('fetched new data');
    console.log(data);
    updateUI(data);
  } catch (error) {
    console.error(
      'Error fetching data from API. trying local storage...:',
      error
    );

    if (cached && cachedTime && currentTime - cachedTime < 3 * 60 * 60 * 1000) {
      console.warn('Using cached localStorage data');
      updateUI(JSON.parse(cached));
    } else {
      console.error('No valid cache found');
      showErrorOnUI('API QUOTA ENDS');
    }
  }
}

function updateUI(data) {
  const matchContainer = document.querySelector('.match-container');
  const firstChild = matchContainer.firstElementChild;
  const details = document.querySelector('details');
  const detailsCloned = details.cloneNode(true);

  while (
    matchContainer.lastElementChild &&
    matchContainer.lastElementChild !== firstChild
  ) {
    matchContainer.removeChild(matchContainer.lastElementChild);
  }

  // Extract relevant match data from the API response
  const scheduleAdWrapper = data.scheduleAdWrapper;
  scheduleAdWrapper.forEach((wrapper) => {
    if (
      !wrapper.matchScheduleMap ||
      !Array.isArray(wrapper.matchScheduleMap.matchScheduleList)
    ) {
      console.warn(
        'Skipping wrapper: matchScheduleList is missing or invalid',
        wrapper
      );
      return;
    }

    const teamsAndStatus = document.createElement('div');
    teamsAndStatus.classList.add(
      'teams-and-status',
      'upcoming-teams-and-status'
    );

    const date = document.createElement('span');
    date.classList.add('date', 'team');
    date.textContent = 'Match Date/Time: ';
    const h4 = document.createElement('h4');
    h4.classList.add('date-container');
    h4.appendChild(date);
    teamsAndStatus.appendChild(h4);

    const detailsCloned_1 = detailsCloned.cloneNode(true);
    const matches = document.createElement('div');
    matches.classList.add('matches');
    matches.appendChild(detailsCloned_1);

    const teams = document.createElement('div');
    teams.classList.add('teams', 'upcoming-teams');

    const upcomingTeam1 = document.createElement('div');
    upcomingTeam1.classList.add('upcoming-team1');
    const upcomingTeam1Name = document.createElement('p');
    upcomingTeam1Name.classList.add('upcoming-team1-name', 'team');
    upcomingTeam1.appendChild(upcomingTeam1Name);

    const vs = document.createElement('span');
    vs.classList.add('vs');

    const upcomingTeam2 = upcomingTeam1.cloneNode(true);
    upcomingTeam2.classList.add('upcoming-team2');
    upcomingTeam2
      .querySelector('.upcoming-team1-name')
      .classList.add('upcoming-team2-name', 'team');

    teams.appendChild(upcomingTeam1);
    teams.appendChild(vs);
    teams.appendChild(upcomingTeam2);
    matches.appendChild(teams);

    date.parentElement.appendChild(
      document.createTextNode(wrapper.matchScheduleMap.date)
    );

    const matchScheduleList = wrapper.matchScheduleMap.matchScheduleList;

    if (Array.isArray(matchScheduleList) && matchScheduleList.length > 0) {
      matchScheduleList.forEach((match, index) => {
        upcomingTeam1Name.textContent =
          match.matchInfo?.[0]?.team1?.teamName || 'team not availabe';
        upcomingTeam2.querySelector('.upcoming-team2-name').textContent =
          match.matchInfo?.[0]?.team2?.teamName || 'team not availabe';
        vs.textContent = 'vs';

        const matchesCloned = matches.cloneNode(true);
        teamsAndStatus.appendChild(matchesCloned);

        const details = matchesCloned.querySelector('.details');
        const summary = details.querySelector('.summary');
        const seriesName = summary.querySelector('.series-name');
        const time = summary.querySelector('.time');

        seriesName.textContent =
          match.seriesName || 'seriesName not available!';
        time.textContent =
          'at ' + match.matchInfo?.[0]?.venueInfo?.timezone ||
          'time not availabe';

        const matchDesc = details.querySelector('.match-description');
        matchDesc.parentElement.lastChild.nodeValue =
          match.matchInfo?.[0]?.matchDesc || 'matchDesc not availabe';
        const matchFormat = details.querySelector('.match-format');
        matchFormat.parentElement.lastChild.nodeValue =
          match.matchInfo?.[0]?.matchFormat || 'matchDesc not availabe';
        const venue = details.querySelector('.venue');
        venue.parentElement.lastChild.nodeValue =
          match.matchInfo?.[0]?.venueInfo?.ground || 'venue not availabe';
      });
    } else {
      console.log('No matches available.');
    }

    matchContainer.appendChild(teamsAndStatus);
    const br = document.createElement('br');
    matchContainer.appendChild(br);
    console.log('matchContainer:', matchContainer);
  });

  console.log('fetched');
}

function showErrorOnUI(message) {
  const matchContainer = document.querySelector('.match-container');
  matchContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// document
//   .getElementById('refresh-button')
//   .addEventListener('click', fetchUpcomingMatch);

fetchUpcomingMatch();
