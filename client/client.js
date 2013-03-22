Meteor.subscribe("devices");

Meteor.startup(function() {
});

function setDevice(context) {
    var _id = context.params._id;
    var device = Devices.findOne({device_id:_id});
    Session.set("current_device", device);
    if (device && device.phone_number) {
        Session.set("phone_number", device.phone_number);
    }
}

Meteor.pages({
    '/': { to: 'login', as: 'root' },
    '/devices/:_id': { to: 'deviceMap', before: [setDevice] },
    '/401': { to: 'unauthorized' },
    '*': { to: 'notFound' }
}, {
    defaults: {
        layout: 'appLayout'
    }
});

Template.history.locs = function() {
    var device = Session.get("current_device");
    if (device) {
        return _.first(_.initial(device.locs).reverse(), 10);
    }
    return [];
};

Template.history.ts = function(ts) {
    //return moment.unix(ts).startOf("minute").fromNow();
    return moment().calendar();
};

Template.history.address = function(loc) {
    loc = loc || {};
    return loc.formatted_address || loc.lat + "," + loc.lng;
};

Template.deviceModal.phoneNumber = function() {
    var phone_number = Session.get("phone_number");
    if (phone_number) {
        return phone_number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }
    return "Unknown phone number"
};

Template.deviceModal.batteryStatus = function() {
    var device = Session.get("current_device");
    console.log(device);
    var status = -1;
    if (device) {
        status = device.battery_status;
        if (status === -1) {
            return "charging";
        } else if ( 0 <= status && status < 5 ) {
            return "zero-thirds";
        } else if ( 5 <= status && status < 33 ) {
            return "one-thirds";
        } else if ( 33 <= status && status < 66 ) {
            return "two-thirds";
        } else if ( 66 <= status && status < 100 ) {
            return "three-thirds";
        }
    }
    return "charging";
};

Template.deviceMap.showHistory = function() {
    Session.setDefault("show_history", false);
    var show = Session.get("show_history");
    return show;
};

var map_rendered = false;
Template.deviceMap.rendered = function() {

    if (!map_rendered) {
        map_rendered = true;
        var self = this,
            currentPoint = L.layerGroup(),
            historyPoints = L.layerGroup(),
            map = L.map('map', {
                zoomControl: false,
                attributionControl: false
            });

        L.control.zoom({position: "bottomleft"}).addTo(map);
        L.tileLayer('http://{s}.tile.cloudmade.com/babdb7f09e4549308c327c0af97fc817/997/256/{z}/{x}/{y}.png', {
            attribution: '',
            maxZoom: 18
        }).addTo(map);

        currentPoint.addTo(map);
        historyPoints.addTo(map);

        Deps.autorun(function() {
            // clear away history points
            historyPoints.clearLayers();

            if (Session.get("show_history")) {
                var device = Session.get("current_device");
                _.each(_.initial(device.locs), function(loc) {
                    var marker = L.circleMarker(
                            [loc.loc.lat, loc.loc.lng],
                            {
                                stroke:false,
                                fillOpacity:1,
                                fillColor: "#cc0000",
                                radius: 5
                            });
                    historyPoints.addLayer(marker);
                });
            }
        });
        Deps.autorun(function() {
            var device = Session.get("current_device");

            if (device) {
                var recent = _.last(device.locs);
                if (recent && recent.loc) {

                    // remove existing points
                    currentPoint.clearLayers();

                    // center map
                    map.setView([recent.loc.lat, recent.loc.lng], 16);

                    // add marker
                    var marker = L.circleMarker(
                            [recent.loc.lat, recent.loc.lng],
                            {
                                stroke:false,
                                fillOpacity:1,
                                fillColor: "#51a351",
                                radius: 8
                            });
                    marker.on('click', function(e) {
                        $('#device-modal').modal('show');
                    });
                    currentPoint.addLayer(marker);
                }

                Meteor.call("location", true, device.phone_number);
    //            $(window).bind("beforeunload", function() {
    //                Meteor.call("location", false, device.phone_number);
    //            });

            }
        });

    }
};

Template.deviceMap.events({
    'click #btn-sound': function() {
        var device = Session.get("current_device");
        Meteor.call("sound", device.phone_number);
    },
    'click #btn-lock': function() {
        var device = Session.get("current_device");
        Meteor.call("lock", device.phone_number);
    },
    'click #btn-lock-passcode': function() {
        var passcode = $('#passcode').val();
        var device = Session.get("current_device");
        console.log(passcode);
        Meteor.call("lock", device.phone_number, passcode);
    },
   'click #btn-wipe': function() {
        var device = Session.get("current_device");
        Meteor.call("wipe", device.phone_number);
    },
    'click #btn-history': function(e) {
        Session.set("show_history", !$(e.target).hasClass('active'));
    },
    'click #passcode': function(e) {
        e.stopPropagation();
    }
});

L.Icon.Default.imagePath = "/packages/leaflet/images";



