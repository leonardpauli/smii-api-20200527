const fs = require('fs')
const neo4j = require('neo4j-driver')

const deinit = require('@leonardpauli/utils/src/deinit.js')
const neo4j_utils = require('@leonardpauli/utils/src/neo4j.js')(neo4j)
const {server_new} = require('@leonardpauli/utils/src/server.js')
const {
	server_start,
	api_handler,
	action_type_generic,
	action_type_load,
	action_load,
} = require('@leonardpauli/utils/src/server_action.js')

const {action_list} = require('./action_list.js')

const {config} = require('../config.js')


// curl 0.0.0.0:3000/api -X POST -w '\n\n%{http_code}\n' -d'{"action":"neo4j_add1","payload":{"n":3}}' # expected: ... 4
// curl 0.0.0.0:3000/api -X POST -w '\n\n%{http_code}\n' -d'{"action":"server_heartbeat"}' # expected: {"date": (iso string)}
// curl 0.0.0.0:3000/api -X POST -d'{"action":"channel.title | search.fuzzy","payload":{"q":"mrbeas"}}'


const main = {
	async init () {

		const ctx = {}

		ctx.session = neo4j_utils.session_setup({config: config.neo4j, deinit})
		const session_get = ctx=> ctx.session

		const action_type_list = [
			action_type_generic(),
			neo4j_utils.server_action_type_raw({session_get}),
		]
		const action_type_register = action_type_load(action_type_list)
		const action_register = action_load(action_list, action_type_register)

		const server = server_new({
			...config.server,
			handlers: [
				api_handler({
					endpoint: '/api',
					ctx_new: ()=> ({...ctx}),
					action_register,
				}),
			],
		})
		
		server_start(server, config.server)

	},
	exit () { // not in use?
		deinit.exit()
	},
}


// start

main.init().catch(console.error)
