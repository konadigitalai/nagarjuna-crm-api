pipeline {
    agent {
    node {
         label 'nagarjuna'
         }
     } 
    environment {
        dockerhub=credentials('docker_hub')
        deployBranch = "${env.BRANCH_NAME}"
        deployService = "your_deploy_dev"
    }
    stages {
        stage('notification-slack') {
            steps {
                slackSend channel: 'deployments', 
                          color: '439FE0', 
                          message: "started ${JOB_NAME} ${BUILD_NUMBER} (<${BUILD_URL}|Open>)", 
                          teamDomain: 'kdigital-tech', 
                          tokenCredentialId: 'slack-id', 
                          username: 'Nagarjuna-crm'
            }
        }
        stage('Old Container') {
            steps {
                script {
                    def containerRunning = sh(script: 'docker inspect -f {{.State.Running}} nag-dev-crm-be', returnStatus: true)
                    if (containerRunning == 0) {
                        sh 'docker container stop nag-dev-crm-be' // Stop the existing container
                        sh 'docker container rm -f nag-dev-crm-be' // Remove the existing container
                    } else {
                        echo 'The specified container does not exist'
                    }
                }
            }
        }
        
        stage('Remove Previous Image') {
            steps {
                script {
                    def imageExists = sh(script: 'docker images -q kdigitaltech/nag-dev-crm-be:latest', returnStatus: true)
                    if (imageExists == 0) {
                        sh 'docker rmi kdigitaltech/nag-dev-crm-be:latest'
                    } else {
                        echo 'The specified image is not found, skipping the image removal stage.'
                    }
                }
            }
        }
        stage('Build Docker Image') {
            steps {
                script {

                    // Get the Jenkins build number
                    def buildNumber = env.BUILD_NUMBER
                    
                    // Build the Docker image with a tag including the build number
                    sh "docker build -t kdigitaltech/nag-dev-crm-be:${buildNumber} ."
                        
                    // Tag the new image as latest
                    sh "docker tag kdigitaltech/nag-dev-crm-be:${buildNumber} kdigitaltech/nag-dev-crm-be:latest"
                }
            }
        }
        stage('Login to DockerHub') {
            steps {
                sh 'echo $dockerhub_PSW | docker login -u $dockerhub_USR --password-stdin'
            }
          }
        stage('Push Image to DockerHub') {
            steps {
                script {
                    // Get the Jenkins build number
                    def buildNumber = env.BUILD_NUMBER
        
                    sh "docker push kdigitaltech/nag-dev-crm-be:${buildNumber}"
                    sh "docker push kdigitaltech/nag-dev-crm-be:latest"
                    sh "docker rmi kdigitaltech/nag-dev-crm-be:${buildNumber}"
                }
            }
        }         
        stage('Run Docker Container') {
            steps {
                script {
                    sh 'docker container run -dt --name nag-dev-crm-be --network nagcrm-network --restart always -p 3013:3000 kdigitaltech/nag-dev-crm-be:latest'
                }
            }
        }
        stage('Check Container Status') {
            steps {
                script {
                    // Use 'docker ps' command to list running containers
                    def containerStatus = sh(script: 'docker ps -q -f name=nag-dev-crm-be', returnStdout: true).trim()
                    
                    if (containerStatus) {
                        echo "Container is running with ID: ${containerStatus}"
                    } else {
                        error "Container is not running!"
                    }
                }
            }
        }

    }
}
