'use strict'

// Class definition
var BEAVERStepper = function (element, options) {
    //////////////////////////////
    // ** Private variables  ** //
    //////////////////////////////
    var the = this

    if (typeof element === 'undefined' || element === null) {
        return
    }

    // Default Options
    var defaultOptions = {
        startIndex: 1,
        animation: false,
        animationSpeed: '0.3s',
        animationNextClass:
            'animate__animated animate__slideInRight animate__fast',
        animationPreviousClass:
            'animate__animated animate__slideInLeft animate__fast',
    }

    ////////////////////////////
    // ** Private methods  ** //
    ////////////////////////////

    var _construct = function () {
        if (BEAVERUtil.data(element).has('stepper') === true) {
            the = BEAVERUtil.data(element).get('stepper')
        } else {
            _init()
        }
    }

    var _init = function () {
        the.options = BEAVERUtil.deepExtend({}, defaultOptions, options)
        the.uid = BEAVERUtil.getUniqueId('stepper')

        the.element = element

        // Set initialized
        the.element.setAttribute('data-beaver-stepper', 'true')

        // Elements
        the.steps = BEAVERUtil.findAll(
            the.element,
            '[data-beaver-stepper-element="nav"]'
        )
        the.btnNext = BEAVERUtil.find(
            the.element,
            '[data-beaver-stepper-action="next"]'
        )
        the.btnPrevious = BEAVERUtil.find(
            the.element,
            '[data-beaver-stepper-action="previous"]'
        )
        the.btnSubmit = BEAVERUtil.find(
            the.element,
            '[data-beaver-stepper-action="submit"]'
        )

        // Variables
        the.totalStepsNumber = the.steps.length
        the.passedStepIndex = 0
        the.currentStepIndex = 1
        the.clickedStepIndex = 0

        // Set Current Step
        if (the.options.startIndex > 1) {
            _goTo(the.options.startIndex)
        }

        // Event listeners
        the.nextListener = function (e) {
            e.preventDefault()

            BEAVEREventHandler.trigger(the.element, 'beaver.stepper.next', the)
        }

        the.previousListener = function (e) {
            e.preventDefault()

            BEAVEREventHandler.trigger(
                the.element,
                'beaver.stepper.previous',
                the
            )
        }

        the.stepListener = function (e) {
            e.preventDefault()

            if (the.steps && the.steps.length > 0) {
                for (var i = 0, len = the.steps.length; i < len; i++) {
                    if (the.steps[i] === this) {
                        the.clickedStepIndex = i + 1

                        BEAVEREventHandler.trigger(
                            the.element,
                            'beaver.stepper.click',
                            the
                        )

                        return
                    }
                }
            }
        }

        // Event Handlers
        BEAVERUtil.addEvent(the.btnNext, 'click', the.nextListener)

        BEAVERUtil.addEvent(the.btnPrevious, 'click', the.previousListener)

        the.stepListenerId = BEAVERUtil.on(
            the.element,
            '[data-beaver-stepper-action="step"]',
            'click',
            the.stepListener
        )

        // Bind Instance
        BEAVERUtil.data(the.element).set('stepper', the)
    }

    var _goTo = function (index) {
        // Trigger "change" event
        BEAVEREventHandler.trigger(the.element, 'beaver.stepper.change', the)

        // Skip if this step is already shown
        if (
            index === the.currentStepIndex ||
            index > the.totalStepsNumber ||
            index < 0
        ) {
            return
        }

        // Validate step number
        index = parseInt(index)

        // Set current step
        the.passedStepIndex = the.currentStepIndex
        the.currentStepIndex = index

        // Refresh elements
        _refreshUI()

        // Trigger "changed" event
        BEAVEREventHandler.trigger(the.element, 'beaver.stepper.changed', the)

        return the
    }

    var _goNext = function () {
        return _goTo(_getNextStepIndex())
    }

    var _goPrevious = function () {
        return _goTo(_getPreviousStepIndex())
    }

    var _goLast = function () {
        return _goTo(_getLastStepIndex())
    }

    var _goFirst = function () {
        return _goTo(_getFirstStepIndex())
    }

    var _refreshUI = function () {
        var state = ''

        if (_isLastStep()) {
            state = 'last'
        } else if (_isFirstStep()) {
            state = 'first'
        } else {
            state = 'between'
        }

        // Set state class
        BEAVERUtil.removeClass(the.element, 'last')
        BEAVERUtil.removeClass(the.element, 'first')
        BEAVERUtil.removeClass(the.element, 'between')

        BEAVERUtil.addClass(the.element, state)

        // Step Items
        var elements = BEAVERUtil.findAll(
            the.element,
            '[data-beaver-stepper-element="nav"], [data-beaver-stepper-element="content"], [data-beaver-stepper-element="info"]'
        )

        if (elements && elements.length > 0) {
            for (var i = 0, len = elements.length; i < len; i++) {
                var element = elements[i]
                var index = BEAVERUtil.index(element) + 1

                BEAVERUtil.removeClass(element, 'current')
                BEAVERUtil.removeClass(element, 'completed')
                BEAVERUtil.removeClass(element, 'pending')

                if (index == the.currentStepIndex) {
                    BEAVERUtil.addClass(element, 'current')

                    if (
                        the.options.animation !== false &&
                        element.getAttribute('data-beaver-stepper-element') ==
                            'content'
                    ) {
                        BEAVERUtil.css(
                            element,
                            'animationDuration',
                            the.options.animationSpeed
                        )

                        var animation =
                            _getStepDirection(the.passedStepIndex) ===
                            'previous'
                                ? the.options.animationPreviousClass
                                : the.options.animationNextClass
                        BEAVERUtil.animateClass(element, animation)
                    }
                } else {
                    if (index < the.currentStepIndex) {
                        BEAVERUtil.addClass(element, 'completed')
                    } else {
                        BEAVERUtil.addClass(element, 'pending')
                    }
                }
            }
        }
    }

    var _isLastStep = function () {
        return the.currentStepIndex === the.totalStepsNumber
    }

    var _isFirstStep = function () {
        return the.currentStepIndex === 1
    }

    var _isBetweenStep = function () {
        return _isLastStep() === false && _isFirstStep() === false
    }

    var _getNextStepIndex = function () {
        if (the.totalStepsNumber >= the.currentStepIndex + 1) {
            return the.currentStepIndex + 1
        } else {
            return the.totalStepsNumber
        }
    }

    var _getPreviousStepIndex = function () {
        if (the.currentStepIndex - 1 > 1) {
            return the.currentStepIndex - 1
        } else {
            return 1
        }
    }

    var _getFirstStepIndex = function () {
        return 1
    }

    var _getLastStepIndex = function () {
        return the.totalStepsNumber
    }

    var _getTotalStepsNumber = function () {
        return the.totalStepsNumber
    }

    var _getStepDirection = function (index) {
        if (index > the.currentStepIndex) {
            return 'next'
        } else {
            return 'previous'
        }
    }

    var _getStepContent = function (index) {
        var content = BEAVERUtil.findAll(
            the.element,
            '[data-beaver-stepper-element="content"]'
        )

        if (content[index - 1]) {
            return content[index - 1]
        } else {
            return false
        }
    }

    var _destroy = function () {
        // Event Handlers
        BEAVERUtil.removeEvent(the.btnNext, 'click', the.nextListener)

        BEAVERUtil.removeEvent(the.btnPrevious, 'click', the.previousListener)

        BEAVERUtil.off(the.element, 'click', the.stepListenerId)

        BEAVERUtil.data(the.element).remove('stepper')
    }

    // Construct Class
    _construct()

    ///////////////////////
    // ** Public API  ** //
    ///////////////////////

    // Plugin API
    the.getElement = function (index) {
        return the.element
    }

    the.goTo = function (index) {
        return _goTo(index)
    }

    the.goPrevious = function () {
        return _goPrevious()
    }

    the.goNext = function () {
        return _goNext()
    }

    the.goFirst = function () {
        return _goFirst()
    }

    the.goLast = function () {
        return _goLast()
    }

    the.getCurrentStepIndex = function () {
        return the.currentStepIndex
    }

    the.getNextStepIndex = function () {
        return _getNextStepIndex()
    }

    the.getPassedStepIndex = function () {
        return the.passedStepIndex
    }

    the.getClickedStepIndex = function () {
        return the.clickedStepIndex
    }

    the.getPreviousStepIndex = function () {
        return _getPreviousStepIndex()
    }

    the.destroy = function () {
        return _destroy()
    }

    // Event API
    the.on = function (name, handler) {
        return BEAVEREventHandler.on(the.element, name, handler)
    }

    the.one = function (name, handler) {
        return BEAVEREventHandler.one(the.element, name, handler)
    }

    the.off = function (name, handlerId) {
        return BEAVEREventHandler.off(the.element, name, handlerId)
    }

    the.trigger = function (name, event) {
        return BEAVEREventHandler.trigger(the.element, name, event, the, event)
    }
}

// Static methods
BEAVERStepper.getInstance = function (element) {
    if (element !== null && BEAVERUtil.data(element).has('stepper')) {
        return BEAVERUtil.data(element).get('stepper')
    } else {
        return null
    }
}

// Webpack support
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = BEAVERStepper
}
