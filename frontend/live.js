const url = 'http://localhost:5000/api/live';
const options = {
  method: 'GET',
};
const upcomingUrl = 'http://localhost:5000/api/upcoming';
const upcomingOptions = {
  method: 'GET',
};
const recentUrl = 'http://localhost:5000/api/recent';
const recentOptions = {
  method: 'GET',
};

let lastUpdated = 0;
let cachedResponse = null;

async function fetchLiveScores() {
  const currentTime = Date.now();

  if (cachedResponse && currentTime - lastUpdated < 60000) {
    console.log('using cached data (client side)');
    updateUI(cachedResponse);
    return;
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    const data = await response.json();
    cachedResponse = data;
    lastUpdated = currentTime;

    // Cache in localStorage for offline or later use
    localStorage.setItem('liveScoresCache', JSON.stringify(data));
    localStorage.setItem('lastUpdated', currentTime.toString());

    console.log('fetched new data');
    console.log(data);
    updateUI(data);
  } catch (error) {
    console.error(
      'Error fetching data from API. trying local storage...:',
      error
    );

    const cached = localStorage.getItem('liveScoresCache');
    const cachedTime = localStorage.getItem('lastUpdated');

    if (cached && cachedTime && currentTime - cachedTime < 60000) {
      console.warn('Using cached localStorage data');
      updateUI(JSON.parse(cached));
    } else {
      console.error('No valid cache found');
      showErrorOnUI('API QUOTA ENDS');
    }
  }
}

// Extract relevant match data from the API response
function updateUI(data) {
  const liveSeries = data?.response;

  const matchContainer = document.querySelector('.match-container');

  const teamsAndStatus = matchContainer.querySelector('.teams-and-status');
  teamsAndStatus.remove();

  while (matchContainer?.children.length > 1) {
    matchContainer.lastElementChild.remove();
  }

  if (liveSeries && liveSeries > 0) {
    liveSeries.forEach((series) => {
      const teamsAndStatusCloned = teamsAndStatus.cloneNode(true);

      const liveMatch = teamsAndStatusCloned.querySelector('.live-match');
      liveMatch.remove();

      const seriesName = series.seriesName;
      const matchList = series.matchList;

      if (matchList) {
        matchList.forEach((list) => {
          const liveMatchCloned = liveMatch.cloneNode(true);

          const matchTitle = list?.matchTitle;
          const matchFormat = list?.matchFormat;
          const matchVenue = list?.matchVenue;
          const matchDate = list?.matchDate;
          const matchTime = list?.matchTime;
          const matchStatus = list?.matchStatus;
          const currentStatus = list?.currentStatus;

          // Update the HTML with the live match data
          teamsAndStatusCloned.querySelector(
            '.series-name'
          ).childNodes[1].nodeValue = seriesName;
          liveMatchCloned.querySelector(
            '.match-title'
          ).childNodes[0].nodeValue = matchTitle + ',';
          liveMatchCloned.querySelector('.match-format').innerText =
            matchFormat;
          liveMatchCloned.querySelector('.match-status').innerText =
            matchStatus;
          liveMatchCloned.querySelector('.venue').lastChild.nodeValue =
            matchVenue;
          liveMatchCloned.querySelector('.date').lastChild.nodeValue =
            matchDate;
          liveMatchCloned.querySelector('.time').lastChild.nodeValue =
            matchTime;
          liveMatchCloned.querySelector('.team1-name').textContent =
            list.teamOne.name;
          liveMatchCloned.querySelector('.team1-score').textContent =
            list.teamOne.score;
          liveMatchCloned.querySelector('.team1-status').textContent =
            list.teamOne.status;
          liveMatchCloned.querySelector('.team2-name').textContent =
            list.teamTwo.name;
          liveMatchCloned.querySelector('.team2-score').textContent =
            list.teamTwo.score;
          liveMatchCloned.querySelector('.team2-status').textContent =
            list.teamTwo.status;
          liveMatchCloned.querySelector('.current-status').innerText =
            currentStatus;

          teamsAndStatusCloned.appendChild(liveMatchCloned);
          matchContainer.appendChild(teamsAndStatusCloned);
          console.log('fetched And updated');
        });
      }
    });
  } else {
    const h2 = document.createElement('h3');
    h2.classList.add('notes');
    matchContainer.appendChild(h2);
    h2.innerHTML = 'No Live Match Right Now!';
  }
}

//Get upcoming match
let upcomingLastUpdated = 0;
let upcomingCachedResponse = null;

async function fetchUpcomingMatch() {
  const currentTime = Date.now();
  const cached = localStorage.getItem('upcomingCache');
  const cachedTime = parseInt(localStorage.getItem('upcomingLastUpdated'), 10);

  if (cached && cachedTime && currentTime - cachedTime < 3 * 60 * 60 * 1000) {
    console.log('using cached data (client side)');
    console.log(JSON.parse(cached));
    upcomingCachedResponse = JSON.parse(cached);
    upcomingLastUpdated = cachedTime;
    updateUpcomingUI(upcomingCachedResponse);
    return;
  }

  try {
    const response = await fetch(upcomingUrl, upcomingOptions);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    const data = await response.json();
    upcomingCachedResponse = data;
    upcomingLastUpdated = currentTime;

    // Cache in localStorage for offline or later use
    localStorage.setItem('upcomingCache', JSON.stringify(data));
    localStorage.setItem('upcomingLastUpdated', currentTime.toString());

    console.log('fetched new data');
    console.log(data);
    updateUpcomingUI(data);
  } catch (error) {
    console.error(
      'Error fetching data from API. trying local storage...:',
      error
    );

    if (cached && cachedTime && currentTime - cachedTime < 3 * 60 * 60 * 1000) {
      console.warn('Using cached localStorage data');
      updateUpcomingUI(JSON.parse(cached));
      console.log(upcomingCachedResponse);
    } else {
      console.error('No valid cache found');
      showErrorOnUI('API QUOTA ENDS');
    }
  }
}

// Extract relevant match data from the API response
function updateUpcomingUI(data) {
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

    const upcomingMatchContainer = document.querySelector(
      '.upcoming-match-container'
    );
    const dateContainer =
      upcomingMatchContainer.querySelector('.date-container');
    const teamsAndStatus =
      upcomingMatchContainer.querySelector('.teams-and-status');
    console.log('teamandstatus', teamsAndStatus);

    const matchScheduleList =
      scheduleAdWrapper[0].matchScheduleMap.matchScheduleList;

    const team1Name = teamsAndStatus.querySelector('#live-upcoming-team1-name');
    const team2Name = teamsAndStatus.querySelector('#live-upcoming-team2-name');

    if (Array.isArray(matchScheduleList) && matchScheduleList.length > 0) {
      dateContainer.lastChild.textContent =
        scheduleAdWrapper[0].matchScheduleMap.date;
      team1Name.textContent =
        matchScheduleList[0].matchInfo?.[0]?.team1?.teamName ||
        'team not availabe';
      team2Name.textContent =
        matchScheduleList[0].matchInfo?.[0]?.team2?.teamName ||
        'team not availabe';

      const details = upcomingMatchContainer.querySelector('.details');
      const summary = upcomingMatchContainer.querySelector('.summary');
      const seriesName = summary.querySelector('.series-name');
      const time = summary.querySelector('.time');

      seriesName.textContent =
        matchScheduleList[0].seriesName || 'seriesName not available!';
      time.textContent =
        'at ' + matchScheduleList[0].matchInfo?.[0]?.venueInfo?.timezone ||
        'time not availabe';

      const matchDesc = details.querySelector('.match-description');
      matchDesc.parentElement.lastChild.nodeValue =
        matchScheduleList[0].matchInfo?.[0]?.matchDesc ||
        'matchDesc not availabe';
      const matchFormat = details.querySelector('.match-format');
      matchFormat.parentElement.lastChild.nodeValue =
        matchScheduleList[0].matchInfo?.[0]?.matchFormat ||
        'matchDesc not availabe';
      const venue = details.querySelector('.venue');
      venue.parentElement.lastChild.nodeValue =
        matchScheduleList[0].matchInfo?.[0]?.venueInfo?.ground ||
        'venue not availabe';
    } else {
      console.log('No matches available.');
    }
  });
  console.log('upcoming match fetched');
}

//get recent match
let recentLastUpdated = 0;
let recentCachedResponse = null;

async function fetchRecentMatch() {
  const currentTime = Date.now();
  const cached = localStorage.getItem('recentCache');
  const cachedTime = parseInt(localStorage.getItem('recentLastUpdated'), 10);

  if (cached && cachedTime && currentTime - cachedTime < 3 * 60 * 60 * 1000) {
    console.log('using cached data (client side)');
    recentCachedResponse = JSON.parse(cached);
    recentLastUpdated = cachedTime;
    updateRecentUI(recentCachedResponse);
    return;
  }

  try {
    const response = await fetch(recentUrl, recentOptions);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server error');
    }

    const data = await response.json();
    recentCachedResponse = data;
    recentLastUpdated = currentTime;

    // Cache in localStorage for offline or later use
    localStorage.setItem('recentCache', JSON.stringify(data));
    localStorage.setItem('recentLastUpdated', currentTime.toString());
    console.log(data);
    updateRecentUI(data);
    console.log('fetched new data');
  } catch (error) {
    console.error(
      'Error fetching data from API. trying local storage...:',
      error
    );

    if (cached && cachedTime && currentTime - cachedTime < 3 * 60 * 60 * 1000) {
      console.warn('Using cached localStorage data');
      updateRecentUI(JSON.parse(cached));
    } else {
      console.error('No valid cache found');
      showErrorOnUI('API QUOTA ENDS');
    }
  }
}

const timestamps = [];
function updateRecentUI(data) {
  const recentMatchContainer = document.querySelector(
    '.recent-match-container'
  );
  const matchType = data.typeMatches;
  function getAllDates() {
    matchType.forEach((type) => {
      const seriesAdWrapper = type.seriesAdWrapper;
      seriesAdWrapper.forEach((wrapper) => {
        const seriesMatches = wrapper.seriesMatches;
        if (seriesMatches) {
          const matches = seriesMatches.matches;
          matches.forEach((match) => {
            const matchDate = match.matchInfo.startDate;
            timestamps.push(matchDate);
            console.log('timestamps', timestamps);
          });
        }
      });
    });
  }
  getAllDates();

  const recentDate = getRecentDate(timestamps);
  let seriesMatches;
  console.log('seriesmatches1', seriesMatches);
  matchType.forEach((type) => {
    const seriesAdWrapper = type.seriesAdWrapper;
    seriesAdWrapper.forEach((wrapper) => {
      seriesMatches = wrapper.seriesMatches;
      if (seriesMatches) {
        console.log('seriesmatches2', seriesMatches);
        const matches = seriesMatches.matches;
        matches.forEach((match) => {
          const matchDate = match.matchInfo.startDate;
          if (matchDate === recentDate) return;
        });
      }
    });
  });

  if (seriesMatches) {
    const seriesName = seriesMatches.seriesName;
    const recentTeamsAndStatus = recentMatchContainer.querySelector(
      '.recent-teams-and-status'
    );
    recentTeamsAndStatus.querySelector('.series-name').lastChild.textContent =
      seriesName;
    const apiMatches = seriesMatches.matches;
    const matches = recentTeamsAndStatus.querySelector('.matches');
    if (apiMatches) {
      //api data
      const matchDesc = apiMatches[0].matchInfo.matchDesc + ',';
      const apiCity = apiMatches[0].matchInfo.venueInfo.city + ',';
      const apiGround = apiMatches[0].matchInfo.venueInfo.ground;
      const apiDateAndTime = apiMatches[0].matchInfo.startDate;
      const apiMatchFormat = apiMatches[0].matchInfo.matchFormat;
      const team1Name = apiMatches[0].matchInfo.team1.teamName;
      const team2Name = apiMatches[0].matchInfo.team2.teamName;
      const apiStatus = apiMatches[0].matchInfo.status;

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

      team1Innings1Runs = apiMatches[0].matchScore?.team1Score?.inngs1?.runs;
      team2Innings1Runs = apiMatches[0].matchScore?.team2Score?.inngs1?.runs;

      const team1Innings2 = apiMatches[0].matchScore?.team1Score?.inngs2;
      if (team1Innings2) {
        team1Innings2Runs = apiMatches[0].matchScore?.team1Score?.inngs2.runs;
        team1Innings2Wickets =
          apiMatches[0].matchScore?.team1Score?.inngs2.wickets;
        team1Innings2Overs = apiMatches[0].matchScore?.team1Score?.inngs2.overs;
      } else {
        team1Innings1Wickets =
          apiMatches[0].matchScore?.team1Score?.inngs1.wickets;
        team1Innings1Overs = apiMatches[0].matchScore?.team1Score?.inngs1.overs;
      }

      const team2Innings2 = apiMatches[0].matchScore?.team2Score?.inngs2;
      if (team2Innings2) {
        console.log('team2inning2', team2Innings2);
        team2Innings2Runs = apiMatches[0].matchScore?.team2Score?.inngs2?.runs;
        team2Innings2Wickets =
          apiMatches[0].matchScore?.team2Score?.inngs2?.wickets;
        team2Innings2Overs =
          apiMatches[0].matchScore?.team2Score?.inngs2?.overs;
      } else {
        team2Innings1Wickets =
          apiMatches[0].matchScore?.team2Score?.inngs1?.wickets;
        team2Innings1Overs =
          apiMatches[0].matchScore?.team2Score?.inngs1?.overs;
      }

      //dom data
      const matchDescription = matches.querySelector('.match-description');
      const city = matches.querySelector('.city');
      const ground = matches.querySelector('.ground');
      const dateAndTime = matches.querySelector('.date-and-time');
      const matchFormat = matches.querySelector('.match-format');
      const recentTeam1Name = matches.querySelector('.recent-team1-name');
      const recentTeam2Name = matches.querySelector('.recent-team2-name');
      const recentStatus = matches.querySelector('.recent-status');
      const recentTeam1Innings1Runs = matches
        .querySelector('.recent-team1')
        .querySelector('.innings1-runs');
      const recentTeam1Innings2Runs = matches
        .querySelector('.recent-team1')
        .querySelector('.innings2-runs');
      const recentTeam2Innings1Runs = matches
        .querySelector('.recent-team2')
        .querySelector('.innings1-runs');
      const recentTeam2Innings2Runs = matches
        .querySelector('.recent-team2')
        .querySelector('.innings2-runs');
      console.log('recentTeam2Innings2Runs first', recentTeam2Innings2Runs);
      const team1Wickets = matches.querySelector('.recent-team1-wickets');
      const team1Overs = matches.querySelector('.recent-team1-overs');
      const team2Wickets = matches.querySelector('.recent-team2-wickets');
      const team2Overs = matches.querySelector('.recent-team2-overs');
      const team1Ampersand = matches.querySelector('.team1-ampersand');
      const team2Ampersand = matches.querySelector('.team2-ampersand');

      const team1Hypen = matches.querySelector('.team1-hypen');
      const team1Parentheses = matches.querySelectorAll('.team1-parentheses');
      const team1Ovs = matches.querySelector('.team1-ovs');
      const team2Hypen = matches.querySelector('.team2-hypen');
      const team2Parentheses = matches.querySelectorAll('.team2-parentheses');
      const team2Ovs = matches.querySelector('.team2-ovs');

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
        console.log('recentTeam2Innings2Runs', recentTeam2Innings2Runs);
        console.log('team2Innings2Runs', team2Innings2Runs);
        recentTeam2Innings2Runs.textContent = team2Innings2Runs;
        team2Wickets.textContent = team2Innings2Wickets;
        team2Overs.textContent = team2Innings2Overs;
      } else {
        team2Ampersand.textContent = '';
        team2Wickets.textContent = team2Innings1Wickets;
        team2Overs.textContent = team2Innings1Overs;
      }
      if (team1Innings1Runs === undefined) {
        team1Hypen.textContent = '';
        team1Parentheses.forEach((parentheses) => {
          parentheses.textContent = '';
        });
        team1Ovs.textContent = '';
      }
      if (team2Innings1Runs === undefined) {
        team2Hypen.textContent = '';
        team2Parentheses.forEach((parentheses) => {
          parentheses.textContent = '';
        });
        team2Ovs.textContent = '';
      }
    }
  }
}

function getRecentDate(timestamps) {
  // Sort in descending order (most recent first)
  timestamps.sort((a, b) => b - a);

  // Get the most recent one
  const mostRecent = timestamps[0];
  return mostRecent;
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
  if (isNaN(date.getTime())) {
    console.error('Invalid Date:', timestamp);
    return 'Invalid Date';
  }
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

function showErrorOnUI(message) {
  const matchContainer = document.querySelector('.match-container');
  matchContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// document
//   .getElementById('refresh-button')
//   .addEventListener('click', fetchLiveScores);
// document
//   .getElementById('refresh-button2')
//   .addEventListener('click', fetchUpcomingMatch);
// document
//   .getElementById('refresh-button3')
//   .addEventListener('click', fetchRecentMatch);

fetchLiveScores();
fetchUpcomingMatch();
fetchRecentMatch();