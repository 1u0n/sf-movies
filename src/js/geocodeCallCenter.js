import { notifyUser, updateUIFinishedCalls, prepareUIFinishedGeocodeCalls } from './ui';


/**
 *  utility to control the calls the user makes to 3rd party geocode services:
 *    -allows a maximum of 3 parallel calls, preventing making too many requests in short period of time and getting throttled
 *    -knows how many calls finished and updates the UI accordingly
 */
export class GeocodeCallCenter {

    constructor(f, numberCalls) {
        this.func = f;
        this.totalCalls = numberCalls;
        this.finishedCalls = 0;
        this.ongoingCalls = 0;
        this.queuedCalls = [];
        this.happenedError = null;
    }

    notifyCallFinished(errorStr) {
        if (errorStr)
            this.happenedError = errorStr;
        updateUIFinishedCalls(++this.finishedCalls, this.totalCalls);
        if (--this.ongoingCalls < 3 && this.queuedCalls.length) {
            setTimeout(function() {
                if (this.queuedCalls.length) {
                    this.ongoingCalls++;
                    (this.queuedCalls.shift())();
                }
            }.bind(this), 150);
        }
        if (this.finishedCalls === this.totalCalls)
            this.allCallsFinished();
    }

    call() {
        if (this.finishedCalls + this.ongoingCalls < this.totalCalls) {
            if (this.ongoingCalls > 2) {
                this.queuedCalls.push(this.func.bind(null, arguments[0]));
            } else {
                this.ongoingCalls++;
                this.func.apply(null, arguments);
            }
        }
    }

    allCallsFinished() {
        if (this.happenedError)
            notifyUser(this.happenedError);
        prepareUIFinishedGeocodeCalls();
    }

}