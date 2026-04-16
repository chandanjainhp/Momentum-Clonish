import React from 'react';

import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildCssUrl } from '../utils/css'
import { HALF_HOUR } from '../utils/time'
import styles from '../../styles/App.module.css'

import { getRandomUrl, fetchRandomLandscape } from '../api/unsplash';
import { NameCtx } from '../contexts/Name'

const TASKS_KEY = 'momentum-clonish-tasks'
const FOCUS_KEY = 'momentum-clonish-focus'
const TZ_KEY = 'momentum-clonish-timezone'
const LIGHT_KEY = 'momentum-clonish-light-mode'
const ZEN_KEY = 'momentum-clonish-zen-mode'
const SEARCH_ENGINE_KEY = 'momentum-clonish-search-engine'

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
]

const SEARCH_ENGINES = {
  yandex: 'https://yandex.com/search/?text=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  google: 'https://www.google.com/search?q=',
}

const weatherCodeToLabel = (code) => {
  if (code === 0) return 'Clear'
  if ([1, 2].includes(code)) return 'Partly cloudy'
  if (code === 3) return 'Cloudy'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rain'
  if ([71, 73, 75, 77].includes(code)) return 'Snow'
  if ([80, 81, 82].includes(code)) return 'Rain showers'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Weather'
}

const weatherCodeToIcon = (code) => {
  if (code === 0) return '☀️'
  if ([1, 2].includes(code)) return '⛅'
  if (code === 3) return '☁️'
  if ([45, 48].includes(code)) return '🌫️'
  if ([51, 53, 55, 56, 57].includes(code)) return '🌦️'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '🌧️'
  if ([71, 73, 75, 77].includes(code)) return '❄️'
  if ([95, 96, 99].includes(code)) return '⛈️'
  return '🌡️'
}

const getGreeting = (hours) => {
  if (hours < 12) return 'Good morning'
  if (hours < 18) return 'Good afternoon'
  return 'Good evening'
}

const safeGetStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback

  const stored = window.localStorage.getItem(key)
  return stored ?? fallback
}

const safeGetStorageJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback

  const stored = window.localStorage.getItem(key)
  if (!stored) return fallback

  try {
    return JSON.parse(stored)
  } catch (error) {
    return fallback
  }
}

function MainComponent({children}) {
  const [bgUrl, setBgUrl] = useState(buildCssUrl(getRandomUrl()))
  const [now, setNow] = useState(new Date())
  const [timezone, setTimezone] = useState(() => safeGetStorage(TZ_KEY, 'UTC'))
  const [focus, setFocus] = useState(() => safeGetStorage(FOCUS_KEY, ''))
  const [taskInput, setTaskInput] = useState('')
  const [tasks, setTasks] = useState(() => safeGetStorageJson(TASKS_KEY, []))
  const [editingTaskId, setEditingTaskId] = useState('')
  const [editingTaskValue, setEditingTaskValue] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [searchEngine, setSearchEngine] = useState(() => safeGetStorage(SEARCH_ENGINE_KEY, 'yandex'))
  const [searchQuery, setSearchQuery] = useState('')
  const [lightMode, setLightMode] = useState(() => safeGetStorage(LIGHT_KEY, 'false') === 'true')
  const [zenMode, setZenMode] = useState(() => safeGetStorage(ZEN_KEY, 'false') === 'true')
  const [weather, setWeather] = useState({
    loading: true,
    city: '',
    temperature: null,
    code: null,
    forecast: [],
  })

  const { name, saveName } = useContext(NameCtx)
  const topTaskRef = useRef(null)

  const refreshBackground = async () => {
    const url = await fetchRandomLandscape()
    if (!url) return

    setBgUrl(buildCssUrl(url))
  }

  const dateTime = useMemo(() => {
    const date = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: timezone,
    })

    const time = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: timezone,
    })

    const hour = Number(
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone,
      }).format(now)
    )

    return {
      date,
      time,
      hour,
    }
  }, [now, timezone])

  const topTask = tasks[0]

  const addTask = (event) => {
    event.preventDefault()

    const text = taskInput.trim()
    if (!text) return

    const newTask = {
      id: `${Date.now()}-${Math.random()}`,
      text,
    }

    setTasks((prevTasks) => [...prevTasks, newTask])
    setTaskInput('')
  }

  const deleteTask = (id) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))

    if (editingTaskId === id) {
      setEditingTaskId('')
      setEditingTaskValue('')
    }
  }

  const moveTask = (id, direction) => {
    setTasks((prevTasks) => {
      const index = prevTasks.findIndex((task) => task.id === id)
      if (index < 0) return prevTasks

      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prevTasks.length) return prevTasks

      const nextTasks = [...prevTasks]
      const [task] = nextTasks.splice(index, 1)
      nextTasks.splice(targetIndex, 0, task)
      return nextTasks
    })
  }

  const startEditTask = (task) => {
    setEditingTaskId(task.id)
    setEditingTaskValue(task.text)
  }

  const saveEditedTask = (event) => {
    event.preventDefault()
    const text = editingTaskValue.trim()
    if (!text) return

    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === editingTaskId ? { ...task, text } : task))
    )
    setEditingTaskId('')
    setEditingTaskValue('')
  }

  const submitName = (event) => {
    event.preventDefault()

    const trimmed = nameInput.trim()
    if (!trimmed) return

    saveName(trimmed)
    setNameInput('')
    setEditingName(false)
  }

  const submitSearch = (event) => {
    event.preventDefault()

    const query = searchQuery.trim()
    if (!query) return

    const engine = SEARCH_ENGINES[searchEngine] || SEARCH_ENGINES.yandex
    const searchUrl = `${engine}${encodeURIComponent(query)}`
    window.open(searchUrl, '_blank', 'noopener,noreferrer')
  }

  const toggleLightMode = () => {
    setLightMode((prevState) => !prevState)
  }

  const toggleZenMode = () => {
    setZenMode((prevState) => !prevState)
  }

  const loadWeather = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setWeather((prevState) => ({
        ...prevState,
        loading: false,
      }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude, longitude } = coords

        try {
          const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&timezone=auto&forecast_days=1`
          )
          const weatherData = await weatherResponse.json()

          const geoResponse = await fetch(
            `https://geocode.maps.co/reverse?lat=${latitude}&lon=${longitude}`
          )
          const geoData = await geoResponse.json()

          const city =
            geoData?.address?.city ||
            geoData?.address?.town ||
            geoData?.address?.village ||
            geoData?.address?.state ||
            'Current location'

          const nowTime = Date.now()
          const nextForecast = (weatherData?.hourly?.time || [])
            .map((time, index) => ({
              time,
              temperature: weatherData?.hourly?.temperature_2m?.[index],
              code: weatherData?.hourly?.weather_code?.[index],
            }))
            .filter((slot) => new Date(slot.time).getTime() > nowTime)
            .slice(0, 5)

          setWeather({
            loading: false,
            city,
            temperature: Math.round(weatherData?.current?.temperature_2m ?? 0),
            code: weatherData?.current?.weather_code ?? 0,
            forecast: nextForecast,
          })
        } catch (error) {
          setWeather((prevState) => ({
            ...prevState,
            loading: false,
          }))
        }
      },
      () => {
        setWeather((prevState) => ({
          ...prevState,
          loading: false,
        }))
      },
      {
        timeout: 10000,
      }
    )
  }

  useEffect(() => {
    refreshBackground()

    const refresherId = setInterval(refreshBackground, HALF_HOUR)
    const clockId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    loadWeather()

    const cleanup = () => {
      clearInterval(refresherId)
      clearInterval(clockId)
    }
    return cleanup
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(FOCUS_KEY, focus)
  }, [focus])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(TZ_KEY, timezone)
  }, [timezone])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SEARCH_ENGINE_KEY, searchEngine)
  }, [searchEngine])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(LIGHT_KEY, String(lightMode))
  }, [lightMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ZEN_KEY, String(zenMode))
  }, [zenMode])

  useEffect(() => {
    if (!topTaskRef.current) return
    topTaskRef.current.focus()
  }, [topTask?.id])

  return (
    <main
      className={`${styles.main} ${lightMode ? styles.lightMode : ''}`}
      style={{ backgroundImage: bgUrl }}
    >
      {!zenMode ? (
        <header className={styles.topBar}>
          <a
            className={styles.sourceLink}
            href="https://github.com/librity/impetus"
            target="_blank"
            rel="noreferrer"
          >
            Source
          </a>

          <div className={styles.topRight}>
            <div className={styles.weatherCard}>
              {weather.loading ? (
                <span>Loading weather...</span>
              ) : (
                <>
                  <span className={styles.weatherIcon}>{weatherCodeToIcon(weather.code)}</span>
                  <span>{weather.temperature}°C</span>
                  <span>{weather.city}</span>
                  <div className={styles.forecastTooltip}>
                    {weather.forecast.length ? (
                      weather.forecast.map((item) => (
                        <div key={item.time} className={styles.forecastItem}>
                          <span>
                            {new Date(item.time).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>{weatherCodeToIcon(item.code)}</span>
                          <span>{Math.round(item.temperature)}°C</span>
                        </div>
                      ))
                    ) : (
                      <span>No forecast available</span>
                    )}
                  </div>
                </>
              )}
            </div>

            <button type="button" className={styles.toggleButton} onClick={toggleLightMode}>
              {lightMode ? 'Dark' : 'Light'}
            </button>

            <button type="button" className={styles.toggleButton} onClick={toggleZenMode}>
              Zen
            </button>
          </div>
        </header>
      ) : null}

      <section className={styles.centerPanel}>
        <p className={styles.dateLabel}>{dateTime.date}</p>
        <h1 className={styles.time}>{dateTime.time}</h1>
        <h2 className={styles.greeting}>
          {getGreeting(dateTime.hour)}{name ? `, ${name}` : ''}.
        </h2>

        {!name || editingName ? (
          <form onSubmit={submitName} className={styles.inlineForm}>
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="What should I call you?"
              className={styles.input}
              autoFocus
            />
            <button type="submit" className={styles.buttonPrimary}>
              Save
            </button>
          </form>
        ) : (
          <button type="button" className={styles.linkButton} onClick={() => setEditingName(true)}>
            Rename
          </button>
        )}

        <div className={styles.focusWrap}>
          <p className={styles.focusLabel}>Main focus today</p>
          <input
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
            placeholder="Ship one important thing"
            className={styles.input}
          />
        </div>

        {!zenMode ? (
          <form onSubmit={submitSearch} className={styles.searchForm}>
            <select
              className={styles.select}
              value={searchEngine}
              onChange={(event) => setSearchEngine(event.target.value)}
            >
              <option value="yandex">Yandex</option>
              <option value="duckduckgo">DuckDuckGo</option>
              <option value="google">Google</option>
            </select>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search the web"
              className={styles.input}
            />
            <button type="submit" className={styles.buttonPrimary}>
              Search
            </button>
          </form>
        ) : null}

        {!zenMode ? (
          <div className={styles.timezoneWrap}>
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              className={styles.select}
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </section>

      {!zenMode ? (
        <aside className={styles.tasksPanel}>
          <div className={styles.tasksHeader}>
            <h3>Tasks</h3>
            {weather.code !== null ? <span>{weatherCodeToLabel(weather.code)}</span> : null}
          </div>

          <form onSubmit={addTask} className={styles.inlineForm}>
            <input
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder="Add a task"
              className={styles.input}
            />
            <button type="submit" className={styles.buttonPrimary}>
              Add
            </button>
          </form>

          <ul className={styles.taskList}>
            {tasks.map((task, index) => (
              <li key={task.id} className={styles.taskItem}>
                {editingTaskId === task.id ? (
                  <form onSubmit={saveEditedTask} className={styles.inlineForm}>
                    <input
                      className={styles.input}
                      value={editingTaskValue}
                      onChange={(event) => setEditingTaskValue(event.target.value)}
                      autoFocus
                    />
                    <button type="submit" className={styles.iconButton}>
                      Save
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      className={styles.taskText}
                      ref={index === 0 ? topTaskRef : null}
                    >
                      {task.text}
                    </button>
                    <div className={styles.taskControls}>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => moveTask(task.id, 'up')}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => moveTask(task.id, 'down')}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => startEditTask(task)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.iconButton}
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}

      {children}
    </main>
  )
}

export default MainComponent
