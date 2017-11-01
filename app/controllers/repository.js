const fs = require('fs')
var exec = require('child_process').exec;

import { rootDirectory } from '../helper/constant'

module.exports.createRepository = (req, res) => {

	if (req.JWTData) {
		let userName = req.JWTData.userName;
		var repositoryName = req.body.repositoryName;
		var language = req.body.language;

		try {
			fs.mkdirSync(rootDirectory + userName + '/' + repositoryName)
			var repoPath = rootDirectory + userName + '/' + repositoryName
			execute('git init --bare ' + repoPath, (result) => {
				//res.json(result.trim())
				fs.writeFileSync(repoPath + "/calldocker.js", fs.readFileSync('/home/sejal/Desktop/constantJS/calldocker.js'));
				fs.writeFileSync(repoPath + "/hooks/post-receive", fs.readFileSync('/home/sejal/Desktop/constantJS/post-receive'));
				exec('chmod +x ' + repoPath + '/hooks/post-receive', (error, stdout, stderr) => {
					console.log('Created post-receive hook');
				})
				let repositoryData = {
					repositoryName: repositoryName,
					userName: userName,
					path: repoPath,
					pathDocker: repoPath + '_docker',
					language: language
				}
				req.app.db.models.Repository.create(repositoryData, (err, result) => {
					if (err) {
						console.log("Error", err);
						return;
					}
					console.log('Check1');
					res.json({ status: 'true', message: 'Repository created successfully' })
				})
			})

		} catch (err) {
			if (err.code !== 'EEXIST')
			console.log("Error", err);
			console.log('Check2');
			res.json({ status: 'false', message: 'Repository already exists please choose another name' })
			return;
		}
	}
	else {
		res.status(403).json("invalid Credentials")
	}
}


module.exports.deleteRepository = (req, res) => {
	if (req.JWTData) {

		let userName = req.JWTData.userName;
		let repositoryName = req.body.repositoryName;
		let id = req.params.id;

		req.app.db.models.Repository.findOneAndRemove({ _id: id }, (err, repositoryData) => {
			if (err) {
				console.log("Error", err);
				return;
			}
			execute('rm -rf ' + repositoryData.path, (result) => {
				console.log(result)
				res.json("Deleted")
			})
			if (repositoryData.containerName != 'kracken') {
				execute('docker stop ' + repositoryData.containerName, (result) => {
					execute('docker rm ' + repositoryData.containerName, (result) => {
						execute('docker rmi ' + repositoryData.containerName, (result) => {
							condole.log("Container deleted")
						})
					})
				})
			}

		})
	}
	else {
		res.status(403).json("invalid Credentials")
	}
}

module.exports.getAllRepositories = (req, res) => {
	console.log(req.JWTData);
	if (req.JWTData) {
		req.app.db.models.Repository.find({ "userName": req.JWTData.userName }, (err, result) => {
			if (err) {
				console.log("Error", err);
				return;
			}
			res.status(200).json(result);
		})
	} else {
		res.status(403).json("invalid Credentials")
	}
}
var execute = (command, callback) => {
	exec(command, (error, stdout, stderr) => {
		console.log("Error", error);
		console.log("Std err", stderr);
		console.log("Stdout", stdout);
		callback(stdout);
	});
};