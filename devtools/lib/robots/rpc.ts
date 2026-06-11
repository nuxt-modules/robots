import { useDevtoolsConnection } from 'nuxtseo-layer-devtools/composables/rpc'

// The layer owns host fetch + route tracking and refreshes data on connect and
// on every route change; robots' state.ts watches refreshTime to reload
// debug + path data, so no module-level host access is needed here.
useDevtoolsConnection()
