{
    init: function(elevators, floors) {
        var floorGoing = {
            up: {},
            down: {}
        };


        function elevatorLogic( elevator, index ) {
            // Whenever the elevator is idle (has no more queued destinations) ...
            elevator.on("idle", function() {
                // check array for data
                var floorArrs = floors.map( function( floor ) { return floor.floorNum() });

                function isQueued( floorNum ) {
                    return floorGoing.down[floorNum] || floorGoing.up[floorNum];
                }

                var floorToGo = floorArrs.find( isQueued );
                if ( floorToGo === undefined ) {
                    floorToGo = this.currentFloor();
                }

                this.goToFloor( floorToGo );

                this.goingUpIndicator(true);
                this.goingDownIndicator(true);

                if ( this.currentFloor() === 0 ) {
                    this.goingUpIndicator(true);
                    this.goingDownIndicator(false);
                }

                if ( this.currentFloor() === floors.length - 1 ) {
                    this.goingUpIndicator(false);
                    this.goingDownIndicator(true);
                }
            });

            elevator.on("floor_button_pressed", function(floorNum) {
                // queue action
                this.goToFloor( floorNum );
            });

            elevator.on("passing_floor", function(floorNum, direction) {
                // set indicator
                var direction = this.destinationDirection();

                if ( direction === 'up' ) {
                    this.goingUpIndicator(true);
                    this.goingDownIndicator(false);
                }

                if ( direction === 'down' ) {
                    this.goingUpIndicator(false);
                    this.goingDownIndicator(true);
                }

                // decide if need to stop or not
                var isFloorSelected = this.getPressedFloors()
                .some( function(floor) {
                    return floor == floorNum;
                });

                if(
                    isFloorSelected ||
                    this.loadFactor() < 1 && // not full
                    floorGoing[direction][floorNum] // outside selected
                ) {
                    this.goToFloor( floorNum, true );
                    this.destinationQueue = this.destinationQueue.filter( function(floor) {
                        return floor !== floorNum;
                    });
                    this.checkDestinationQueue();
                }

            });

            elevator.on("stopped_at_floor", function( floorNum ) {
                // set indicator
                if ( this.currentFloor() === 0 ) {
                    this.goingUpIndicator(true);
                    this.goingDownIndicator(false);

                    floorGoing.up[0] = false;
                }

                if ( this.currentFloor() === floors.length - 1 ) {
                    this.goingUpIndicator(false);
                    this.goingDownIndicator(true);

                    floorGoing.down[floors.length - 1] = false;
                }

                var direction = this.destinationDirection();
                if ( direction !== 'stopped' ) {
                    this.goingUpIndicator(true);
                    this.goingDownIndicator(true);
                    floorGoing[direction][floorNum] = false;
                }
            });
        }

        function floorLogic( floor ) {

            var level = floor.floorNum();

            floorGoing.up[level] = false;
            floorGoing.down[level] = false;

            floor.on("up_button_pressed", function() {
                // mutate state for needing to go up
                floorGoing.up[level] = true
            });

            floor.on("down_button_pressed", function() {
                // mutate state for needing to go down
                floorGoing.down[level] = true
            });
        }

        elevators.map( elevatorLogic );
        floors.map( floorLogic )
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
