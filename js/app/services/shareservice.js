'use strict';

/**
 * @ngdoc service
 * @name passmanApp.ShareService
 * @description
 * # ShareService
 * Service in the passmanApp.
 */
angular.module('passmanApp')
	.service('ShareService', ['$http', 'VaultService', 'EncryptService', function ($http, VaultService, EncryptService) {
		// Setup sjcl random engine to max paranoia level and start collecting data
		var paranoia_level = 10
		sjcl.random.setDefaultParanoia(paranoia_level);
		sjcl.random.startCollectors();

		return {
			search: function (string) {
				var queryUrl = OC.generateUrl('apps/passman/api/v2/sharing/search');
				return $http.post(queryUrl, {search: string}).then(function (response) {
					if (response.data) {
						return response.data;
					} else {
						return response;
					}
				});
			},
			generateRSAKeys: function(key_length, progress, callback){
				var p = new C_Promise(function(promise){
					var state = forge.pki.rsa.createKeyPairGenerationState(key_length, 0x10001);
					var step = function() {
						// run for 100 ms
						if(!forge.pki.rsa.stepKeyPairGenerationState(state, 100)) {
							// console.log(state);
							if (state.p !== null) {
								// progress(50);
								promise.call_progress(50);
							}
							else {
								// progress(0);
								promise.call_progress(50);
							}
							setTimeout(step, 1);
						}
						else {
							// callback(state.keys);
							promise.call_then(state.keys);
						}
					};
					setTimeout(step, 100);
				});
				return p;
			},
			generateSharedKey: function(size){
				size = size || 20;
				return new C_Promise(function(promise){ /** prmise C_Promise **/
					CRYPTO.PASSWORD.generate(size,
						function(pass) {
							promise.call_then(pass);
						},
						function(progress) {
							promise.call_progress(progress);
						}
					);
				})
			},
			rsaKeyPairToPEM: function(keypair){
				return {
					'publicKey' 	: forge.pki.publicKeyToPem(keypair.publicKey),
					'privateKey' 	: forge.pki.privateKeyToPem(keypair.privateKey)
				};
			},
			getSharingKeys: function(){
				var vault = VaultService.getActiveVault();
				return{
					'private_sharing_key': EncryptService.decryptString(angular.copy(vault.private_sharing_key)),
					'public_sharing_key': vault.public_sharing_key
				};
			},
			rsaPrivateKeyFromPEM: function(private_pem) {
				return forge.pki.privateKeyFromPem(private_pem);
			},
			rsaPublicKeyFromPEM: function(public_pem){
				return forge.pki.publicKeyFromPem(public_pem);
			}
		}
	}]);
