{
    init: function(elevators, floors) {
        var floorGoing = {
            up: {},
            down: {}
        };

        function elevatorLogic( elevator, index ) {
            function onIdle() {
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
                console.log( 'goToFloor', this.destinationQueue );

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
            }

            function beforePassingFloor( floorNum, direction ) {
                console.log( direction, floorGoing[direction] );
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

                if ( direction === 'stopped' ) {
                    this.goingUpIndicator(true);
                    this.goingDownIndicator(true);
                }

                // decide if need to stop or not
                var isFloorSelected = this.getPressedFloors()
                .some( function(floor) {
                    return floor == floorNum;
                });

                if(
                    isFloorSelected ||
                    this.loadFactor() < 0.5 && // not full
                    floorGoing[direction][floorNum] // outside selected
                ) {
                    var log = {
                        floorNum: floorNum,
                        pressed: isFloorSelected,
                        load: this.loadFactor(),
                        called: floorGoing[direction][floorNum]
                    };
                    console.log( 'reason for stopping', log );
                    this.goToFloor( floorNum, true );
                }

                console.log( 'current queue', this.destinationQueue );
            }

            function onStop( floorNum ) {
                console.log( 'queue', this.destinationQueue );

                this.destinationQueue = this.destinationQueue
                .filter( function( q ) {
                    return q !== floorNum;
                });
                this.checkDestinationQueue();

                // set indicator
                if ( this.currentFloor() === 0 ) {
                    this.goingUpIndicator(true);
                    this.goingDownIndicator(false);

                    floorGoing.up[0] = false;
                    console.log( 'clearing', 0, 'up', floorGoing.up);
                }

                if ( this.currentFloor() === floors.length - 1 ) {
                    this.goingUpIndicator(false);
                    this.goingDownIndicator(true);

                    floorGoing.down[floors.length - 1] = false;
                    console.log( 'clearing', floors.length - 1, 'down', floorGoing.down);
                }

                var direction = this.destinationDirection();
                if ( direction !== 'stopped' ) {
                    this.goingUpIndicator(true);
                    this.goingDownIndicator(true);
                    floorGoing[direction][floorNum] = false;
                    console.log( 'clearing', floorNum, direction, floorGoing[direction]);
                }
            }

            // Whenever the elevator is idle (has no more queued destinations) ...
            elevator.on("idle", onIdle);

            elevator.on("floor_button_pressed", function(floorNum) {
                this.goToFloor( floorNum );
                console.log( 'goToFloor', this.destinationQueue );
            });

            elevator.on("passing_floor", beforePassingFloor);

            elevator.on("stopped_at_floor", onStop);
        }

        function floorLogic( floor ) {

            var level = floor.floorNum();

            floorGoing.up[level] = false;
            floorGoing.down[level] = false;

            floor.on("up_button_pressed", function() {
                // mutate state for needing to go up
                floorGoing.up[level] = true;
                console.log( 'setting', level, 'up', floorGoing.up );
            });

            floor.on("down_button_pressed", function() {
                // mutate state for needing to go down
                floorGoing.down[level] = true
                console.log( 'setting', level, 'down', floorGoing.down );
            });
        }

        elevators.map( elevatorLogic );
        floors.map( floorLogic )
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}
