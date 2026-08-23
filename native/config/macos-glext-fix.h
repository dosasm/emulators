#ifndef DOSASM_MACOS_GL_GLEXT_FIX_H
#define DOSASM_MACOS_GL_GLEXT_FIX_H

#if defined(__APPLE__) && !defined(EMSCRIPTEN)

/*
 * On macOS, <GL/gl.h> (OpenGL.framework) pulls in Apple's system glext.h,
 * which defines the GL_ARB_* / GL_EXT_* extension guards but only provides
 * "gl*ProcPtr" style function-pointer typedefs - not the Khronos-style
 * "PFNGL*" typedefs that DOSBox-X's voodoo_vogl.h relies on.
 *
 * This header is force-included (via -include) before every translation unit
 * of the native dosbox-x targets, so the vendored DOSBox-X submodule builds
 * unmodified on macOS.
 */

#include <GL/gl.h>

#undef __glext_h_
#undef __gl_glext_h_
#undef GL_ARB_shader_objects
#undef GL_ARB_vertex_program
#undef GL_ARB_vertex_shader
#undef GL_EXT_blend_func_separate
#undef GL_EXT_framebuffer_object
#include <SDL_opengl_glext.h>

#endif /* __APPLE__ && !EMSCRIPTEN */

#endif /* DOSASM_MACOS_GL_GLEXT_FIX_H */
