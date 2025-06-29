export interface PromiseResult<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

export interface PromiseWrapperOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  onFinally?: () => void
}

/**
 * Wraps a promise with error handling and optional callbacks
 * @param promise The promise to wrap
 * @param options Optional callbacks for success, error, and finally
 * @returns A promise that resolves to PromiseResult
 */
export async function promiseWrapper<T>(
  promise: Promise<T>,
  options?: PromiseWrapperOptions
): Promise<PromiseResult<T>> {
  const result: PromiseResult<T> = {
    data: null,
    error: null,
    loading: true,
  }

  try {
    const data = await promise
    result.data = data
    result.loading = false
    
    if (options?.onSuccess) {
      options.onSuccess(data)
    }
    
    return result
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    result.error = err
    result.loading = false
    
    if (options?.onError) {
      options.onError(err)
    }
    
    return result
  } finally {
    if (options?.onFinally) {
      options.onFinally()
    }
  }
}

/**
 * A hook-like function that provides loading state management for promises
 * @param initialLoading Initial loading state
 * @returns Object with execute function and state
 */
export function createPromiseExecutor<T>(initialLoading = false) {
  let loading = initialLoading
  let data: T | null = null
  let error: Error | null = null

  const execute = async (
    promise: Promise<T>,
    options?: PromiseWrapperOptions
  ): Promise<PromiseResult<T>> => {
    loading = true
    error = null
    
    const result = await promiseWrapper(promise, options)
    
    loading = result.loading
    data = result.data
    error = result.error
    
    return result
  }

  const getState = (): PromiseResult<T> => ({
    data,
    error,
    loading,
  })

  return {
    execute,
    getState,
    get loading() { return loading },
    get data() { return data },
    get error() { return error },
  }
}

/**
 * Utility for handling multiple promises concurrently
 * @param promises Array of promises to execute
 * @param options Global options for all promises
 * @returns Promise that resolves to array of results
 */
export async function promiseAllWrapper<T>(
  promises: Promise<T>[],
  options?: PromiseWrapperOptions
): Promise<PromiseResult<T>[]> {
  const results = await Promise.allSettled(promises)
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      const successResult: PromiseResult<T> = {
        data: result.value,
        error: null,
        loading: false,
      }
      
      if (options?.onSuccess) {
        options.onSuccess(result.value)
      }
      
      return successResult
    } else {
      const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason))
      const errorResult: PromiseResult<T> = {
        data: null,
        error,
        loading: false,
      }
      
      if (options?.onError) {
        options.onError(error)
      }
      
      return errorResult
    }
  })
} 