Meteor.subscribe("devices");

Meteor.startup(function() {
    Meteor.autorun(function() {

    });
});

function setDevice(context) {
    console.log(context);
    var _id = context.params._id;
    Session.set("current_device", Devices.findOne({device_id:_id}));
}

Meteor.pages({
    '/': { to: 'login', as: 'root' },
    '/devices': { to: 'deviceIndex', nav: 'devices' },
    '/devices/:_id': { to: 'deviceMap', before: [setDevice] },
    '/401': { to: 'unauthorized' },
    '*': { to: 'notFound' }
}, {
    defaults: {
        layout: 'appLayout'
    }
});

Template.deviceIndex.helpers({
    devices: function() {
        return Devices.findOne();
    }
});

Template.deviceMap.rendered = function() {
    var self = this;
    var map = L.map('map');

    Deps.autorun(function() {
        var device = Session.get("current_device");
        console.log(device);

        if (device) {
            var recent = _.last(device.locs);
            if (recent && recent.loc) {
                map.setView([recent.loc.lat, recent.loc.lng], 16);
                L.tileLayer('http://{s}.tile.cloudmade.com/babdb7f09e4549308c327c0af97fc817/997/256/{z}/{x}/{y}.png', {
                    attribution: '',
                    maxZoom: 18
                }).addTo(map);
                var marker = L.marker([recent.loc.lat, recent.loc.lng]).addTo(map);
                marker.on('click', function(e) {
                    console.log(e);
                });
            }
        }
    });
};

Template.deviceShow.events({
    'click' : function() {
        console.log(arguments);
    }
});

L.Icon.Default.imagePath = "/packages/leaflet/images";
