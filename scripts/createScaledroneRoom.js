export const createScaledroneRoom = async (props) => {
    return new Promise((resolve, reject) => {
        const eventLog = [];
        const drone = new Scaledrone(props.channelId);
        const room = drone.subscribe(props.roomName);
        const subscribers = {};
        let isOpen = false;

        const result = {
            subscribe: (name, callback) => {
                subscribers[name] = callback;
                return () => delete subscribers[name]
            },
            publish: message => {
                if (!isOpen) {
                    return false;
                }

                drone.publish({
                    room: props.roomName,
                    message: { message: message, clientId: drone.clientId }
                });

                return true;
            },
            getEvents: () => eventLog
        };

        drone.on('close', event => {
            eventLog.push({msg: 'Drone Closed', data: event});
            isOpen = false;
        });

        drone.on('error', error => {
            eventLog.push({msg: 'Drone Error', data: error});
            isOpen = false;
            reject(error);
        });

        drone.on('disconnect', event => {
            eventLog.push({msg: 'Drone disconnect', data: event});
            isOpen = false;
        });

        drone.on('reconnect', event => {
            eventLog.push({msg: 'Drone reconnect', data: event});
            isOpen = true;
        });

        room.on('open', error => {
            if (error) {
                eventLog.push({msg: 'Room error', data: error});
                isOpen = false;
                return;
            }

            isOpen = true;
            eventLog.push({msg: 'Room opened', data: {}});
            resolve(result);
        });

        room.on('data', data => {
            if (data.clientId === drone.clientId) {
                return;
            }
            Object.values(subscribers).forEach(callback => callback(data.message))
        });
    });
};

