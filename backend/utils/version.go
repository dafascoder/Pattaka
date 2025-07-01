package utils

// GenerateVersion generates a version number based on the current time
// version is incremented by 1 for each change made to the workflow
// this is used to track the version of the workflow
// and to track the changes made to the workflow

func GenerateVersion(version int) int {
	return version + 1
}
