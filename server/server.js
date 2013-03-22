Meteor.publish("devices", function() {
    return Devices.find();
});

var https_request = {
    params: {
        api_token: "42426e7e-d8d9-4f01-b400-82cc74f89aa0",
        phoneNumber: "+13479477051"

    },
    url: "https://switchcoder.com/code/238/invoke",
    headers: { "Content-Type" : "application/json" },
    method: "GET"
};

var switchcoder = function(mdn, msg) {
    var options = _.extend({}, https_request);
    options.params.number = mdn;
    options.params.msg = msg;
    var res = Meteor.http.call(options.method, options.url, { headers: options.headers, params: options.params });
    console.log(res.statusCode)
    if (res.statusCode === 200) {
        return true;
    } else {
        return false;
    }
};

Meteor.methods({
    location: function(type, mdn) {
        this.unblock();
        if (type) {
            return switchcoder(mdn, "rwreveal:startlocation");
        } else {
            return switchcoder(mdn, "rwreveal:stoplocation");
        }
    },
    sound: function(mdn) {
        this.unblock();
        return switchcoder(mdn, "rwreveal:startsound");
    },
    lock: function(mdn, code) {
        this.unblock();
        return switchcoder(mdn, "rwreveal:lock::1234");
    },
    wipe: function(mdn) {
        this.unblock();
        return switchcoder(mdn, "rwreveal:wipe");
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
                    typeof device.loc.lat === "number" && //device.loc.lat >= -90 && device.loc.lat <= 90 &&
                    typeof device.loc.lng === "number" //&& //device.loc.lng >= -90 && device.loc.lng <= 90 
                  ) ) {
                return [400, "invalid loc input"];
            }

            var loc = { locs : { loc: {lat:device.loc.lat, lng: device.loc.lng, timestamp: new Date} } };

            // https://developers.google.com/maps/documentation/geocoding/#ReverseGeocoding
            var res = Meteor.http.call("GET", "http://maps.googleapis.com/maps/api/geocode/json?latlng="+device.loc.lat+","+device.loc.lng+"&sensor=true");

            if (res && res.data && res.data.results && res.data.results[0] && res.data.results[0].formatted_address) {
                loc.locs.loc.formatted_address = res.data.results[0].formatted_address;
            }

            Devices.update(
                { device_id: id },
                { $push: loc}
            );

            return [204, ""];
        } else {
            // no such device
            return [404, {"Content-Type": "application/json"}, JSON.stringify({"error": "no such device"})];
        }


    }
);

Meteor.startup(function() {
    if (Devices.find().count() == 0) {
        // brandon
        Devices.insert({
           device_id: "351746051969387",
           phone_number: "9195938413",
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
        // shawn
        Devices.insert({
           device_id: "351746052000190",
           phone_number: "9195932451",
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
        // justin
        Devices.insert({
           device_id: "351746052000182",
           phone_number: "9196333026",
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
        // steve
        Devices.insert({
           device_id: "351746052000273",
           phone_number: "9195258287",
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

