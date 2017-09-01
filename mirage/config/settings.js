import {Response} from 'ember-cli-mirage';

export default function mockSettings(server) {
    // These endpoints use the raw database & fixtures without going
    // through the ORM at all (meaning no setting model). This is due
    // to https://github.com/samselikoff/ember-cli-mirage/issues/943
    // as far as can be determined.
    // potential TODO: update once the above issue is fixed? We don't really
    // gain anything from using the ORM for settings so it may not be a good idea
    server.get('/settings/', function ({db}, {queryParams}) {
        let {type} = queryParams;
        let filters = type.split(',');
        let settings = [];

        if (!db.settings) {
            server.loadFixtures('settings');
        }

        filters.forEach((type) => {
            settings.pushObjects(db.settings.where({type}));
        });

        return {
            settings,
            meta: {filters: {type}}
        };
    });

    server.put('/settings/', function ({db}, {requestBody}) {
        let newSettings = JSON.parse(requestBody).settings;

        if (newSettings.findBy('key', 'scheduling')) {
            return new Response(403, {}, {
                errors: [{
                    errorType: 'NoPermissionError',
                    message: 'You do not have permission to edit scheduling.'
                }]
            });
        }

        newSettings.forEach((newSetting) => {
            let {key} = newSetting;
            db.settings.update({key}, newSetting);
        });

        return {
            meta: {},
            settings: db.settings
        };
    });
}