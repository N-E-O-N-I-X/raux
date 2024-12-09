/*-----------------| ROOT CONSTANTS |--------------------------------------------------------------------
    Stuff tha doesn't change, mostly HTML element ID's and templates.
-------------------------------------------------------------------------------------------------------*/

//  Highest Priority IDs
const ROOT = document.documentElement
const CONTEXT = document.getElementById('context') // Bar at the top that displays hover context
const LANDING = document.getElementById('landing') // Enter Site screen
const WRAPPER = document.getElementById('wrapper') // Wrapper of everything but header info
const ENTER_BUTTON = document.getElementById('enter_button')

//  Control Panel
const VOLUME_SLIDER = document.getElementById('volume_slider')
const MUSIC_TOGGLE = document.getElementById('music_toggle')
const MUSIC_TOGGLE_ICON = document.getElementById('music_toggle_icon')
const CRT_TOGGLE = document.getElementById('crt_toggle')
const CRT_TOGGLE_ICON = document.getElementById('crt_toggle_icon')

//  Navbar
const NAVBAR_ICON = document.getElementById('navbar_icon')
const EXTERNAL_BUTTON_CONTAINER = document.getElementById('button_scroller')
const EXTERNAL_BUTTON_TEMPLATE = document.getElementById('button_template')

//  Pages
const PAGE_LIST = document.querySelectorAll('.page_content') // Collection of all page information

//  ???
const LOG_CONTENT = document.getElementById('log_content')
const LOG_LIST = document.getElementById('log_list')
const LOG_TEMPLATE = document.getElementById('log_template')

//  Gallery
const GALLERY = document.getElementById('gallery')
const GALLERY_PREVIEW = document.getElementById('gallery_preview')
const GALLERY_PREVIEW_IMG = document.getElementById('gallery_preview_img')
const GALLERY_ARRAY = document.getElementById('gallery_array')
const GALLERY_ITEM_TEMPLATE = document.getElementById('gallery_item_template')

//  Commission
const COMMISSION = document.getElementById('commission')
const COMMISSION_TYPES = document.querySelectorAll('.commission_type')
const COMMISSION_DESCRIPTION = document.getElementById('commission_description')
const COMMISSION_PRICING = document.getElementById('commission_pricing')
const COMMISSION_EXTRA = document.getElementById('commission_extra')
const COMMISSION_PREFERENCES = document.getElementById('commission_preferences')

//  Statistics
const COHERENCE = document.getElementById('coherence')
const COUNTER = document.getElementById('counter')

//  Vanity
const CRT_SCAN_FX = document.getElementById('crt_scan_fx')

/*-----------------| VARIABLES |-------------------------------------------------------------------------
    Stuff that changes, mostly to do with lerping and page information.
-------------------------------------------------------------------------------------------------------*/

//  Toggles
let musicOn = JSON.parse(localStorage.getItem('musicOn') || true)
let crtOn = JSON.parse(localStorage.getItem('crtOn') || true)
let galleryLoaded = false
let logLoaded = false

//  Parallax
let easingEnabled = true // Flag for performance conservation
let easeFactor = 3 // Factor by which to increase or decrease the lerping speed
let lastEaseTime = Date.now() // Must init to Date.now()
let mouseRealPosition = [0, 0] // Real global X, Y of mouse
let mouseRealOffset = [0, 0] // -1 to 1 target offset determined by lerper()
let parallaxEasedOffset = [0, 0, 1] // Final eased offset coefficients
let windowMax = [window.innerWidth, window.innerHeight] // Updated to be accurate

//  Easing
let easedRate = 1
let targetRate = 1
let commission_info = {}

//  Etc
let currentPage = 'about'
let mutVol = 0

/*-----------------| HOWLER |----------------------------------------------------------------------------
    Load all sound effects and update volume incase of LOUD. (sorry canth)
-------------------------------------------------------------------------------------------------------*/

//  Main SFX sprite
let sfx = new Howl({
    src: ['./snd/sfxmap.ogg'],
    volume: 0.4,
    sprite: {
      gallery:      [0, 1000],
      commission:   [1000, 1000],
      links:        [2000, 1000],
      mutilation:    [3000, 1000],
      about:        [4000, 1000],
      hover:        [5000, 1000],
      expand:       [6000, 1900],
      openart:      [8000, 2000],
      drop:         [10000, 2000],
      crt_on:       [12000, 2000],
      crt_off:      [14000, 2000],
      music_on:     [16000, 2000],
      music_off:    [18000, 2000],
      secret:       [20000, 2000],
      tap:          [22000, 1000],
      log:          [23000, 8000],
      silence:      [31000, 1000]
    },
    mute: true
})

//  Background ambience
let theme = new Howl({
    src: './snd/amb/theme.ogg',
    volume: 0.15,
    loop: true,
})

//  Mutilation ambience
let theme_mutilation = new Howl({
    src: './snd/amb/mutilation.ogg',
    volume: 0.15,
    loop: true,
})

//  Enter sound
let enterSnd = new Howl({
    src: './snd/enter.ogg',
    volume: 0.3,
})

updateToggleGraphic(MUSIC_TOGGLE_ICON, musicOn)
updateToggleGraphic(CRT_TOGGLE_ICON, crtOn)

loadVolume()
updateCRT()

/*-----------------| GENERAL FUNCTIONS |------------------------------------------------------------------
    Commonly used functions, querying CSS variables, lerping, etc.
-------------------------------------------------------------------------------------------------------*/

//  Update CSS variable value
function CSS(VarName, VarProperty) {
    document.documentElement.style.setProperty('--' + VarName, VarProperty)
}

//  Linear interpolation
function lerp(p1, p2, t) {
    return p1 + (p2 - p1) * t
}

//  Smooth movements (THANK YOU MATT)
function lerper(now_ms) {
    if(easingEnabled) { // calculate easing only if we need to

        //  Create the offset ranges from the real position
        mouseRealOffset[0] = (mouseRealPosition[0] / windowMax[0])
        mouseRealOffset[1] = (mouseRealPosition[1] / windowMax[1])

        //  Handle unestablished case
        if(isNaN(mouseRealOffset[0]) || mouseRealOffset[0] == undefined) {
            mouseRealOffset[0] = 0
            mouseRealOffset[1] = 0
        }

        //  Use a local ease factor that keeps the easing rate directly linked to delta-T instead of framerate
        let LocalEaseFactor = Math.min(1, (now_ms - lastEaseTime) / 1000)
        lastEaseTime = now_ms

        //  Lerper
        parallaxEasedOffset[0] = Number(lerp(parallaxEasedOffset[0], mouseRealOffset[0], LocalEaseFactor * easeFactor).toFixed(8))
        parallaxEasedOffset[1] = Number(lerp(parallaxEasedOffset[1], mouseRealOffset[1], LocalEaseFactor * easeFactor).toFixed(8)) // toFixed to relax the computation strain

        //  Setters
        CSS('M_XP', parallaxEasedOffset[0] * 100 + '%')
        CSS('M_YP', parallaxEasedOffset[1] * 100 + '%')
    }
}


//  Event-based updaters and initializer
function handleMouseMove(event) {
    mouseRealPosition = [event.pageX, event.pageY]
}
function onResize(event) {
    windowMax = [window.innerWidth, window.innerHeight]
}

//  Main loop function
function mainLoop() {
    requestAnimationFrame(mainLoop)
    let NOW = Date.now()
    smoothMusicRate(NOW)
    lerper(NOW)
}

//  Fetch and return JSON data
async function fetchJSON(file) {
    try {
        const response = await fetch(file)
        const data = await response.json()
        return data
    } catch (error) {
        console.error('JSON fetch failed:', error)
        throw error
    }
}

function smoothMusicRate(now_ms) {
    let LocalEaseFactor = Math.min(1, (now_ms - lastEaseTime) / 300)
    easedRate = Number(lerp(easedRate, musicOn * targetRate, LocalEaseFactor))
    theme.rate(easedRate)
    theme.volume(currentVolume * easedRate)
    theme_mutilation.volume(currentVolume * (1 - easedRate) * musicOn)
}

//  Event attachment and initializer
document.addEventListener('mousemove', handleMouseMove)
window.addEventListener('resize', onResize)

window.addEventListener('load', function() {
    mainLoop()
})

/*-----------------| PAGE HANDLING |--------------------------------------------------------------------
    Handle when the user backtracks, loads, and reloads new pages.
-------------------------------------------------------------------------------------------------------*/

// Navigate to appropriate page if hash contains valid string
if (window.location.hash) {
    const hashValue = window.location.hash.substring(1)
    const target_page = document.getElementById(hashValue)
    if (target_page) {
        changePage(hashValue)
    }
} else {
    changePage('about')
}

//  Update hash history if user has navigated
function pushHash(hashString) {
    if ('#' + hashString != window.location.hash) {
        if (history.pushState) {
            history.pushState(null, null, '#' + hashString)
        } else {
            location.hash = '#' + hashString
        }
    }
}

//  Display correct page according to request and load gallery if needed
function changePage(destination) {
    const page_selected = document.getElementById(destination) || document.getElementById('about')

    if (page_selected) { // If the page exists

        PAGE_LIST.forEach(page_item => { // Hide all pages
            page_item.classList.add('hidden')
            page_item.classList.remove('shown')
        })

        page_selected.classList.remove('hidden')   // Show this page
        page_selected.classList.add('shown')       // Make it flicker
        CONTEXT.textContent = page_selected.getAttribute('context') // Update context
        
        targetRate = 1
        if (destination === 'gallery' && !galleryLoaded) { // Update gallery if need be
            loadGallery()
        }

        if (destination === 'log' && !logLoaded) {
            loadLog()
        }

        targetRate = page_selected.getAttribute('rate') || 1

        document.getElementById('page_title').textContent = destination // Update the page title
        console.log('Page changed to ' + destination + '.')
        sfx.play(destination)
        currentPage = destination
    }
}

//  Change the topbar
function updateContext(info) {
    if (info) {
        CONTEXT.textContent = info
    }
}

//  Update page when user uses browser navigation
addEventListener('hashchange', () => {
    changePage(window.location.hash.substring(1))
})

//
function updateCRT() {
    if (crtOn) {
        document.body.classList.add('crt')
        CRT_SCAN_FX.classList.remove('hidden')
    } else {
        document.body.classList.remove('crt')
        CRT_SCAN_FX.classList.add('hidden')
    }
}

/*-----------------| VOLUME |----------------------------------------------------------------------------
    Handle volume changes and make sure users ears don't detonate.
-------------------------------------------------------------------------------------------------------*/

//  Update howler objects
function updateVolume() {
    sfx.volume(currentVolume)
    theme.volume(currentVolume * 0.6)
    theme_mutilation.volume(currentVolume  * 0.6)
    enterSnd.volume(currentVolume)
}

//  Load cached volume and update graphics to reflect the change
function loadVolume() {
    let loaded_vol = localStorage.getItem('volume') || 0.4 // Sorry Cantharus
    currentVolume = loaded_vol
    VOLUME_SLIDER.value = currentVolume
    updateVolume()
}

//  Assign appropriate graphic to toggle switches
function updateToggleGraphic(graphic, state) {
    graphic.src = state ? graphic.getAttribute('on') : graphic.getAttribute('off')
}

/* ----------------|   ???   |---------------------------------------------------------------------------
    Stop
-------------------------------------------------------------------------------------------------------*/

function formatUnixTimestamp(unixTimestamp) {
    // Create a new Date object using the Unix timestamp
    const date = new Date(unixTimestamp * 1000); // multiply by 1000 to convert seconds to milliseconds
    
    // Get the day and month
    const day = String(date.getDate()).padStart(2, '0'); // Pad day with leading zero if needed
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
    
    // Return formatted date
    return `${month}/${day}`;
}

//  Initialize gallery items
function loadLog() {
    fetchJSON('./json/log.json?t=' + (new Date()).getTime())  // Yielding call for gallery data
    .then(data => {     // Itterate through array and create gallery items
        data.forEach(post => {
            createLogEntry(post)
        })
    })
    logLoaded = true;
}


//  Clone gallery item template and assign info
function createLogEntry(post) {
    let clone = LOG_TEMPLATE.cloneNode(true)
    clone.removeAttribute('id')
    clone.classList.remove('hidden')

    const POST_DATE = formatUnixTimestamp(post[0])

    clone.textContent = post[1] + ' - ' + POST_DATE

    bindButton(clone, 'expand', 'hover') // Make sounds occur

    clone.addEventListener('mouseenter', () => {
        CONTEXT.textContent = post[1]
    })

    clone.addEventListener('mousedown', () => {
        LOG_CONTENT.innerHTML = post[2]
    })

    LOG_LIST.appendChild(clone) // Append finished gallery item to gallery
    LOG_CONTENT.innerHTML = post[2]
}

/*-----------------| GALLERY |---------------------------------------------------------------------------
    Fetch gallery JSON and make all the little tiles for users to click on.
-------------------------------------------------------------------------------------------------------*/

//  Initialize gallery items
function loadGallery() {
    fetchJSON('./json/gallery.json?t=' + (new Date()).getTime())// Yielding call for gallery data
    .then(data => {     // Itterate through array and create gallery items
        data.forEach(piece => {
            createGalleryItem(piece)
        })
    })
    galleryLoaded = true
}


//  Clone gallery item template and assign info
function createGalleryItem(piece) {
    let clone = GALLERY_ITEM_TEMPLATE.cloneNode(true)
    clone.removeAttribute('id')
    clone.classList.remove('hidden')
    clone.style.backgroundImage = 'url("./img/art/thumbnail/' + piece[1] + '")'
    clone.setAttribute('context', piece[0])

    if (piece[2] == 0) { // If Date isn't known (not ternary cuz readability)
        clone.querySelector('text').textContent = 'DATE UNKNOWN'
    } else { // Otherwise format a date
        clone.querySelector('text').textContent = Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(piece[2] * 1000)
    }

    bindButton(clone, 'openart') // Make sounds occur

    clone.addEventListener('mousedown', () => { // Update preview & context on click
        GALLERY_PREVIEW_IMG.style.animation = '';
        GALLERY_PREVIEW_IMG.src  = './img/art/original/' + piece[1]
        GALLERY_PREVIEW.href = './img/art/original/' + piece[1]
        gallery_description.textContent = piece[3]
        GALLERY.setAttribute('context', piece[0])
        document.querySelectorAll('.unfiltered2').forEach(toGrey => {toGrey.classList.remove('unfiltered2')})
        clone.classList.add('unfiltered2')
        setTimeout(() => {GALLERY_PREVIEW_IMG.style.animation = 'imageAppear 0.5s ease-out 1'}, 0)
    })

    GALLERY_ARRAY.appendChild(clone) // Append finished gallery item to gallery
}

GALLERY_PREVIEW.addEventListener('click', () => {
    sfx.play('drop')
})

/*-----------------| COMMISSION |------------------------------------------------------------------------
    Fetch commission JSON and build the types list + updaters.
-------------------------------------------------------------------------------------------------------*/

//  Construct commission types
fetchJSON('./json/commission.json')
.then(data => {commission_info = data})
COMMISSION_TYPES.forEach(type => {
    bindButton(type, 'drop', 'silence')
    type.addEventListener('mousedown', () => {
        const info = commission_info[type.textContent.toLocaleLowerCase()]
        COMMISSION_TYPES.forEach(toGrey => {toGrey.classList.remove('unfiltered')})
        type.classList.add('unfiltered')
        COMMISSION_DESCRIPTION.innerHTML = info[1]
        COMMISSION_PRICING.innerHTML = Object.entries(info[0])
            .map(([key, value]) => `${key}: <span class="selectable"; style="color: #0f0 !important; text-shadow: #0d0 0 0 1vh;"><br>$${value}</span>`)
            .join('<br>')
    })
})

/*-----------------| BUTTONS |---------------------------------------------------------------------------
    Bind all button functionality and sounds.
-------------------------------------------------------------------------------------------------------*/

//  Bind button to update context if it has any, and play some sounds
function bindButton(button, clickSnd = 'expand', hoverSnd = 'hover',) {
    button.addEventListener('mousedown', () => sfx.play(clickSnd))
    button.addEventListener('mouseenter', () => {updateContext(button.getAttribute('context')); sfx.play(hoverSnd)})
    button.addEventListener('mouseleave', () => updateContext(document.getElementsByClassName('shown')[0].getAttribute('context')))
}

//  Give most buttons generic sounds and events
document.querySelectorAll('.navbar_button, .link, .external_button, .commission_type').forEach(button => bindButton(button))
// document.querySelectorAll('.mut_button').forEach(button => bindButton(button, 'mutilation', 'hover'))
//  Enter button
ENTER_BUTTON.addEventListener('mousedown', () =>{
    LANDING.classList.add('hidden')
    WRAPPER.classList.remove('hidden')
    enterSnd.play()
    theme.play()
    theme_mutilation.play()
    sfx.mute(false)
})

//  navbar buttons
document.querySelectorAll('.navbar_button').forEach(button => { // Make all navbar buttons play sound & change to respective page
    const content = button.textContent.toLowerCase()
    button.addEventListener('mousedown', () =>  {
        pushHash(content)
        changePage(content)
    })
})

//  Volume slider
VOLUME_SLIDER.addEventListener('input', function () {
    currentVolume = VOLUME_SLIDER.value

    updateVolume()
    localStorage.setItem('volume', currentVolume)
})

//  Music button
MUSIC_TOGGLE.addEventListener('mousedown', function() {
    musicOn = !musicOn

    sfx.play(crtOn ? 'music_on' : 'music_off')
    updateVolume()
    updateToggleGraphic(MUSIC_TOGGLE_ICON, musicOn)
    localStorage.setItem('musicOn', musicOn)
})

//  CRT button
CRT_TOGGLE.addEventListener('mousedown', function() {
    crtOn = !crtOn

    sfx.play(crtOn ? 'crt_on' : 'crt_off')
    updateCRT()
    updateToggleGraphic(CRT_TOGGLE_ICON, crtOn)
    localStorage.setItem('crtOn', crtOn)
})

//  Site buttons
fetchJSON('./json/buttons.json')
.then(data => {
    CSS('ButtonCount', data.length)
    data.forEach(button => {
        let instance = EXTERNAL_BUTTON_TEMPLATE.cloneNode(true)
        instance.removeAttribute('id')
        instance.setAttribute('href', button[0])
        instance.innerHTML = `<img class="external_button" src="./img/button/${button[1]}"></img>`
        instance.classList.remove('hidden')
        bindButton(instance, 'drop', 'tap')
        EXTERNAL_BUTTON_CONTAINER.appendChild(instance)
    })
})

bindButton(MUSIC_TOGGLE, 'silence')
bindButton(CRT_TOGGLE, 'silence')
bindButton(VOLUME_SLIDER, 'silence')

NAVBAR_ICON.addEventListener('mousedown', function() {
    sfx.play('drop');

    easedRate *= 0.8;
})

/*-----------------| TOUCHES |---------------------------------------------------------------------------
    Miscellanious JSON data fetches and such.
-------------------------------------------------------------------------------------------------------*/

//  Coherence value
fetchJSON('https://state.corru.network/')
.then(response => {COHERENCE.textContent = response.state.substring(0,4)})

//  Page view counter
fetchJSON('https://rayka.goatcounter.com/counter//.json')
.then(response => {COUNTER.textContent = response.count})