cmake_minimum_required(VERSION 3.21)
project(js-dos)

set(X86 false)
set(GL4ES false)
if (${EMSCRIPTEN})
	set(X86_64 false)
	set(GL4ES true)
else ()
	set(USE_HUMBLENET false)
	# Detect actual architecture instead of assuming x86_64
	if(CMAKE_SYSTEM_PROCESSOR MATCHES "^(x86_64|AMD64|amd64)$")
		set(X86_64 true)
	elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "^(i386|i486|i586|i686|x86)$")
		set(X86 true)
	else()
		set(X86_64 false)
		set(X86 false)
	endif()
endif ()

if (USE_HUMBLENET)
	add_definitions(-DUSE_HUMBLENET)
	set(HUMBLENET_LIBRARY_PATH "$ENV{HOME}/js-dos/HumbleNet/cmake-build-debug-ssl/")
endif()

if (GL4ES)
	include(ExternalProject)
	add_compile_definitions(-DGL4ES=1)
	set(GL4ES_PREFIX_DIR "${CMAKE_BINARY_DIR}/gl4es")
	set(GL4ES_INSTALL_DIR "${GL4ES_PREFIX_DIR}/build")
	set(GL4ES_LIBRARY "${GL4ES_INSTALL_DIR}/lib/libGL.a")
	set(GL4ES_INCLUDE "${GL4ES_INSTALL_DIR}/include")

	if (EMSCRIPTEN)
		set(GL4ES_CONFIGURE
			"emcmake"
			"${CMAKE_COMMAND}"
			"-G${CMAKE_GENERATOR}"
			"-DCMAKE_BUILD_TYPE=Release"
			"-DNOX11=ON"
			"-DNOEGL=ON"
			"-DSTATICLIB=ON"
			"-DCMAKE_POLICY_VERSION_MINIMUM=3.5"
			"${GL4ES_INSTALL_DIR}"
		)
	else()
		set(GL4ES_CONFIGURE
				"${CMAKE_COMMAND}"
				"-G${CMAKE_GENERATOR}"
				"-DCMAKE_BUILD_TYPE=Debug"
				"-DNOX11=ON"
				"-DNOEGL=ON"
				"-DSTATICLIB=ON"
				"-DCMAKE_POLICY_VERSION_MINIMUM=3.5"
				"${GL4ES_INSTALL_DIR}"
		)
	endif()

	ExternalProject_Add(gl4es
			GIT_REPOSITORY https://github.com/ptitSeb/gl4es.git
			GIT_TAG a744af14d4afbda77bf472bc53f43b9ceba39cc0
			UPDATE_DISCONNECTED 1
			PREFIX "${CMAKE_BINARY_DIR}/gl4es"
			SOURCE_DIR "${GL4ES_INSTALL_DIR}"
			CONFIGURE_COMMAND ${GL4ES_CONFIGURE}
			BUILD_COMMAND "${CMAKE_MAKE_PROGRAM}"
			BUILD_BYPRODUCTS "${GL4ES_LIBRARY}"
			INSTALL_COMMAND ""
	)
endif()

set(BUILD_NATIVE_LIBZIP true)

set(SRC_DIR "${CMAKE_CURRENT_LIST_DIR}/src")
set(NATIVE_DIR "${CMAKE_CURRENT_LIST_DIR}/native")
set(TARGETS_DIR "${CMAKE_CURRENT_LIST_DIR}/targets")

# add_compile_options(-fno-exceptions)

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -w -Werror=return-type -fsigned-char")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -w -Werror=return-type -fsigned-char") 

if ((CMAKE_BUILD_TYPE STREQUAL "Debug") OR (CMAKE_BUILD_TYPE STREQUAL ""))
	message(STATUS "DEBUG BUILD")

	# asan
	 add_compile_options(-fsanitize=address -fno-omit-frame-pointer)
	 add_link_options(-fsanitize=address)
else ()
	message(STATUS "RELEASE BUILD")
	add_compile_options(-Oz)
	set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -Oz -flto=thin")
endif()

if(${EMSCRIPTEN})
	add_definitions(-DEMSCRIPTEN)

	set(EM_LINK_OPTIONS
		"-Wl,-u,htons" # https://github.com/emscripten-core/emscripten/issues/16836
		"-Wl,-u,ntohs" # https://github.com/emscripten-core/emscripten/issues/16836
		"--emit-symbol-map"
		"-sTOTAL_STACK=1MB"
		"-sMALLOC=emmalloc"
		"-sMEMORY64=0"
		"-sWASM_BIGINT=0"
		"-sASSERTIONS=0"
		"-sSAFE_HEAP=0"
		"-sTOTAL_MEMORY=67108864"
		"-sALLOW_MEMORY_GROWTH=1"
		"-sEXIT_RUNTIME=1"
		"-sINVOKE_RUN=0"
		"-sMODULARIZE=1"
		"-sFORCE_FILESYSTEM=1"
		"-sEXPORTED_RUNTIME_METHODS=['addRunDependency', 'removeRunDependency','FS', 'FS_createPath', 'FS_createPreloadedFile', \
			'FS_createDataFile', 'lengthBytesUTF8', 'stringToUTF8', 'UTF16ToString', 'UTF8ToString', 'callMain', 'err', \
			'HEAPU8', 'HEAPU32', 'HEAPF32']"
		"-sEXPORTED_FUNCTIONS=['_main', '_malloc', '_free', '_abort']"
		"-sERROR_ON_UNDEFINED_SYMBOLS=1")
elseif(APPLE)
	add_definitions(-DEMSCRIPTEN_KEEPALIVE=)
	add_definitions(-DMACOSX)
	# X86_64 is already set above based on architecture detection
elseif(MINGW)
	add_definitions(-DEMSCRIPTEN_KEEPALIVE=)
	# X86_64 is already set above based on architecture detection
else()
	add_definitions(-DEMSCRIPTEN_KEEPALIVE=)
	set(CMAKE_C_COMPILER "/usr/bin/clang")
	set(CMAKE_CXX_COMPILER "/usr/bin/clang++")
#	add_definitions(-DC_DEBUG=1 -DC_HEAVY_DEBUG=1)
endif()

# Create GL symlink for OpenGL headers on macOS
if(APPLE AND NOT EMSCRIPTEN)
    set(GL_SYMLINK_DIR "${CMAKE_BINARY_DIR}/gl_include")
    file(MAKE_DIRECTORY "${GL_SYMLINK_DIR}/GL")
    execute_process(COMMAND ln -sf "/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/System/Library/Frameworks/OpenGL.framework/Headers/gl.h" "${GL_SYMLINK_DIR}/GL/gl.h" RESULT_VARIABLE LN_RESULT)
    if(NOT LN_RESULT EQUAL 0)
        message(WARNING "Failed to create GL symlink")
    endif()
    include_directories("${GL_SYMLINK_DIR}")
endif()

include_directories(
		"${SRC_DIR}/protocol"
		"${NATIVE_DIR}/sockdrive/include"
)

if (USE_HUMBLENET)
	include_directories("${NATIVE_DIR}/humblenet/src/humblenet/include")
endif()

# tier 1
include("${TARGETS_DIR}/zip.cmake")
include("${TARGETS_DIR}/dosbox.cmake")
include("${TARGETS_DIR}/dhry2.cmake")
include("${TARGETS_DIR}/sokol.cmake")

# tier 2
include("${TARGETS_DIR}/dosbox-sdl.cmake")
include("${TARGETS_DIR}/dosbox-x-sdl2.cmake")

set(SOKOL_SHDC_DIR "${CMAKE_CURRENT_LIST_DIR}/native/sokol-tools-bin/bin")
if (APPLE AND CMAKE_SYSTEM_PROCESSOR STREQUAL "arm64")
    set(SOKOL_SHDC "${SOKOL_SHDC_DIR}/osx_arm64/sokol-shdc")
elseif (APPLE)
    set(SOKOL_SHDC "${SOKOL_SHDC_DIR}/osx/sokol-shdc")
elseif (WIN32)
    set(SOKOL_SHDC "${SOKOL_SHDC_DIR}/win32/sokol-shdc.exe")
else ()
    set(SOKOL_SHDC "${SOKOL_SHDC_DIR}/linux/sokol-shdc")
endif ()

add_custom_target(sokol-shaders
		COMMAND "${SOKOL_SHDC}"
		--input "${CMAKE_CURRENT_LIST_DIR}/native/sokol/shaders.glsl"
		--output "${CMAKE_CURRENT_LIST_DIR}/native/sokol/shaders.h"
		--slang glsl330)