// const recentUrl = 'http://localhost:5000/api/recent';
const recentUrl = 'https://live-cricket-score-f9hg.onrender.com/api/recent';
const recentOptions = {
  method: 'GET',
};

let lastUpdated = 0;
let cachedResponse = null;

async function fetchRecentMatch() {
  const currentTime = Date.now();
  const cached = localStorage.getItem('recentCache');
  const cachedTime = parseInt(localStorage.getItem('lastUpdated'), 10);

  if (cached && cachedTime && currentTime - cachedTime < 3 * 60 * 60 * 1000) {
    console.log('using cached data (client side)');
    cachedResponse = JSON.parse(cached);
    lastUpdated = cachedTime;
    updateUI(cachedResponse);
    return;
  }

  try {
    const response = await fetch(recentUrl, recentOptions);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    const data = await response.json();
    cachedResponse = data;
    lastUpdated = currentTime;

    // Cache in localStorage for offline or later use
    localStorage.setItem('recentCache', JSON.stringify(data));
    localStorage.setItem('lastUpdated', currentTime.toString());
    console.log(data);
    updateUI(data);
    console.log('fetched new data');
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
  const teamsAndStatus = document.querySelector('.teams-and-status');
  const teamsAndStatusCloned = teamsAndStatus.cloneNode(true);
  const firstChild = matchContainer.firstElementChild;
  const nextElementSibling = firstChild.nextElementSibling;
  // const details = document.querySelector('details');
  // const detailsCloned = details.cloneNode(true);

  while (
    matchContainer.lastElementChild &&
    matchContainer.lastElementChild !== firstChild &&
    matchContainer.lastElementChild !== nextElementSibling
  ) {
    matchContainer.removeChild(matchContainer.lastElementChild);
  }

  const matchType = data.typeMatches;

  matchType.forEach((type) => {
    const seriesName = type.seriesAdWrapper.forEach((wrapper) => {
      const seriesMatches = wrapper.seriesMatches;

      if (seriesMatches) {
        const seriesName = seriesMatches.seriesName;

        const teamsAndStatusCloned_1 = teamsAndStatusCloned.cloneNode(true);

        teamsAndStatusCloned_1.querySelector('.series-name').lastChild.textContent =
         seriesName;

        const apiMatches = seriesMatches.matches;

        const matches = teamsAndStatusCloned_1.querySelector('.matches');
        matches.remove();
        if (apiMatches) {
          apiMatches.forEach((match) => {
            const matchesCloned = matches.cloneNode(true);

            //api data
            const matchDesc = match.matchInfo.matchDesc + ',';
            const apiCity = match.matchInfo.venueInfo.city + ',';
            const apiGround = match.matchInfo.venueInfo.ground;
            const apiDateAndTime = match.matchInfo.startDate;
            const apiMatchFormat = match.matchInfo.matchFormat;
            const team1Name = match.matchInfo.team1.teamName;
            const team2Name = match.matchInfo.team2.teamName;
            const apiStatus = match.matchInfo.status;

            let team1Innings1Runs,
              team1Innings1Wickets,
              team1Innings1Overs,
              team1Innings2Runs,
              team1Innings2Wickets,
              team1Innings2Overs;
            let team2Innings1Runs,
              team2Innings1Wickets,
              team2Innings1Overs,
              team2Innings2Runs,
              team2Innings2Wickets,
              team2Innings2Overs;

            team1Innings1Runs = match.matchScore?.team1Score?.inngs1?.runs;
            team2Innings1Runs = match.matchScore?.team2Score?.inngs1?.runs;

            const team1Innings2 = match.matchScore?.team1Score?.inngs2;
            if (team1Innings2) {
              team1Innings2Runs = match.matchScore?.team1Score?.inngs2.runs;
              team1Innings2Wickets =
                match.matchScore?.team1Score?.inngs2.wickets;
              team1Innings2Overs = match.matchScore?.team1Score?.inngs2.overs;
            } else {
              team1Innings1Wickets =
                match.matchScore?.team1Score?.inngs1.wickets;
              team1Innings1Overs = match.matchScore?.team1Score?.inngs1.overs;
            }

            const team2Innings2 = match.matchScore?.team2Score?.inngs2;
            if (team2Innings2) {
              console.log('team2inning2', team2Innings2);
              team2Innings2Runs = match.matchScore?.team2Score?.inngs2?.runs;
              team2Innings2Wickets =
                match.matchScore?.team2Score?.inngs2?.wickets;
              team2Innings2Overs = match.matchScore?.team2Score?.inngs2?.overs;
            } else {
              team2Innings1Wickets =
                match.matchScore?.team2Score?.inngs1?.wickets;
              team2Innings1Overs = match.matchScore?.team2Score?.inngs1?.overs;
            }

            //dom data
            const matchDescription =
              matchesCloned.querySelector('.match-description');
            const city = matchesCloned.querySelector('.city');
            const ground = matchesCloned.querySelector('.ground');
            const dateAndTime = matchesCloned.querySelector('.date-and-time');
            const matchFormat = matchesCloned.querySelector('.match-format');
            const recentTeam1Name =
              matchesCloned.querySelector('.recent-team1-name');
            const recentTeam2Name =
              matchesCloned.querySelector('.recent-team2-name');
            const recentStatus = matchesCloned.querySelector('.recent-status');
            const recentTeam1Innings1Runs = matchesCloned
              .querySelector('.recent-team1')
              .querySelector('.innings1-runs');
            const recentTeam1Innings2Runs = matchesCloned
              .querySelector('.recent-team1')
              .querySelector('.innings2-runs');
            const recentTeam2Innings1Runs = matchesCloned
              .querySelector('.recent-team2')
              .querySelector('.innings1-runs');
            const recentTeam2Innings2Runs = matchesCloned
              .querySelector('.recent-team2')
              .querySelector('.innings2-runs');
            const team1Wickets = matchesCloned.querySelector(
              '.recent-team1-wickets'
            );
            const team1Overs = matchesCloned.querySelector(
              '.recent-team1-overs'
            );
            const team2Wickets = matchesCloned.querySelector(
              '.recent-team2-wickets'
            );
            const team2Overs = matchesCloned.querySelector(
              '.recent-team2-overs'
            );
            const team1Ampersand =
              matchesCloned.querySelector('.team1-ampersand');
            const team2Ampersand =
              matchesCloned.querySelector('.team2-ampersand');

            const team1Hypen = matchesCloned.querySelector('.team1-hypen');
            const team1Parentheses =
              matchesCloned.querySelectorAll('.team1-parentheses');
            const team1Ovs = matchesCloned.querySelector('.team1-ovs');
            const team2Hypen = matchesCloned.querySelector('.team2-hypen');
            const team2Parentheses =
              matchesCloned.querySelectorAll('.team2-parentheses');
            const team2Ovs = matchesCloned.querySelector('.team2-ovs');

            matchDescription.textContent = matchDesc;
            city.textContent = apiCity;
            ground.textContent = apiGround;
            dateAndTime.parentElement.lastChild.nodeValue =
              convertToLocalTime(apiDateAndTime);
            matchFormat.parentElement.lastChild.nodeValue = apiMatchFormat;
            recentTeam1Name.textContent = team1Name;
            recentTeam2Name.textContent = team2Name;
            recentStatus.textContent = apiStatus;

            recentTeam1Innings1Runs.textContent = team1Innings1Runs;
            recentTeam2Innings1Runs.textContent = team2Innings1Runs;

            if (team1Innings2) {
              recentTeam1Innings2Runs.textContent = team1Innings2Runs;
              team1Wickets.textContent = team1Innings2Wickets;
              team1Overs.textContent = team1Innings2Overs;
            } else {
              team1Ampersand.textContent = '';
              team1Wickets.textContent = team1Innings1Wickets;
              team1Overs.textContent = team1Innings1Overs;
            }

            if (team2Innings2) {
              recentTeam2Innings2Runs.textContent = team2Innings2Runs;
              team2Wickets.textContent = team2Innings2Wickets;
              team2Overs.textContent = team2Innings2Overs;
            } else {
              team2Ampersand.textContent = '';
              team2Wickets.textContent = team2Innings1Wickets;
              team2Overs.textContent = team2Innings1Overs;
            }
            if (team1Innings1Runs === undefined) {
              console.log(team1Innings1Runs);
              team1Hypen.textContent = '';
              team1Parentheses.forEach((parentheses) => {
                parentheses.textContent = '';
              });
              team1Ovs.textContent = '';
            }
            if (team2Innings1Runs === undefined) {
              console.log(team2Innings1Runs);
              team2Hypen.textContent = '';
              team2Parentheses.forEach((parentheses) => {
                parentheses.textContent = '';
              });
              team2Ovs.textContent = '';
            }

            teamsAndStatusCloned_1.appendChild(matchesCloned);
          });
        }

        matchContainer.appendChild(teamsAndStatusCloned_1);
      }
    });
  });
}

function showErrorOnUI(message) {
  const matchContainer = document.querySelector('.match-container');
  matchContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

function convertToLocalTime(timestamp) {
  if (typeof timestamp === 'string') {
    timestamp = Number(timestamp); 
  }

  const date = new Date(timestamp); 

  // Check if the timestamp is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid Date:', timestamp);
    return 'Invalid Date';
  }

  // Convert UTC to User's Time
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const userTime = new Intl.DateTimeFormat('en-US', options).format(date);

  return `${userTime} LOCAL`;
}

// document
//   .getElementById('refresh-button')
//   .addEventListener('click', fetchRecentMatch);

	fetchRecentMatch();
