Meteor.publish("devices", function() {
    return Devices.find();
});

Meteor.methods({
    playSound: function() {

    },
    reportLost: function() {

    },
    eraseDevice: function() {

    }
});

Meteor.startup(function() {
    if (Devices.find().count() == 0) {
        Devices.insert({
           device_id: "3f5aa22ad129b216",
           phone_number: "+19198671175",
           key: "394430",
           battery_status: -1,
           timestamp: 1363748809,
           locs: [
             {
               timestamp: 1363748809,
               loc: { lat: 35.784014, lng: -78.819418 }
             }
           ],
           sound_mode: false,
           lost_mode: false,
           erase_mode: false
        });
    }
});

Meteor.Router.add(
    "/api/v1/devices/:id/status",
    "GET",
    function(id) {
        var device = Devices.findOne({device_id: id});
        var res = _.pick(device, "sound_mode", "lost_mode", "erase_mode");
        console.log(res);
        return [200, JSON.stringify(res)];
    }
);

Meteor.Router.add(
    "/api/v1/devices",
    "POST",
    function() {
        var device = this.request.body;
        console.log(device);

        if (! ( typeof device.phone_number === "string" && device.phone_number.length &&
                typeof device.key === "string" && device.key.length &&
                typeof device.device_id === "string" && device.device_id.length) ) {
            return [400, "phone_number, key device_id must be a string"];
        }

        var obj = _.extend({
            battery_status: -1,
            timestamp: new Date,
            locs: [{
                loc: {
                    lat: 1,
                    lng: 2
                }
            }]
        }, device);
        Devices.insert(obj);

        return [201, {"Content-Type":"application/json"}, JSON.stringify(_.omit(obj, "device_id"))];
    }
);

Meteor.Router.add(
    "/api/v1/devices/:id/battery_status",
    "POST",
    function(id) {
        var device = this.request.body;
        console.log(id);
        console.log(device);

        if (! ( typeof device.battery_status === "number" && device.battery_status > -1 && device.battery_status <= 100 ) ) {
            return [400, "battery_status must be a number between -1 and 100"];
        }

        Devices.update(
            { device_id: id },
            { $set: { battery_status : device.battery_status, timestamp: new Date } }
        );

        return [204, ""];

    }
);

Meteor.Router.add(
    "/api/v1/devices/:id/loc",
    "POST",
    function(id) {
        var device = this.request.body;
        console.log(id);
        console.log(device);

        var stored_device = Devices.findOne({device_id: id});

        if (stored_device) {

            if (! ( typeof device.loc === "object" &&
                    typeof device.loc.lat === "number" && device.loc.lat >= -90 && device.loc.lat <= 90 &&
                    typeof device.loc.lng === "number" && device.loc.lng >= -90 && device.loc.lng <= 90 ) ) {
                return [400, "invalid loc input"];
            }

            Devices.update(
                { device_id: id },
                { $push: { locs : { loc: {lat:device.loc.lat, lng: device.loc.lng} } } }
            );

            return [204, ""];
        } else {
            // no such device
            return [404, {"Content-Type": "application/json"}, JSON.stringify({"error": "no such device"})];
        }


    }
);
